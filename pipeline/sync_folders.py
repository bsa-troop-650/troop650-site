"""Folder lifecycle + Drive-as-source-of-truth for galleries.

Two ownership regimes, split at each event's START date:

  UPCOMING calendar event (start >= today): the calendar owns it. Its Drive
  folder is created and (re)named to match the calendar title. Cancelling the
  event trashes/orphans the folder.

  PAST calendar event OR any manual folder (start < today, or no calendar event
  at all): Drive owns it. The folder name is authoritative -- it drives the
  gallery title, slug, and (parsed) date. Rename the folder -> gallery renames;
  delete the folder -> gallery is removed; drop a brand-new folder in -> a new
  gallery appears next run. Manual folders never surface in "upcoming" (that
  section is calendar-only) -- they're photo galleries only.

Order of operations matters: cancelled upcoming events are orphaned/trashed
FIRST (renamed with a leading "_") so the Drive pass skips them and cannot
resurrect a doc the calendar step just deleted.
"""
import datetime as dt
from zoneinfo import ZoneInfo

from .config import (DRY_RUN, INBOX_FOLDER_NAME, PARENT_FOLDER_ID, STORAGE_BUCKET,
                     TZ, log)
from .gcp import bucket, db, drive_svc
from .naming import parse_folder_name, slug_for, type_for

LA = ZoneInfo(TZ)
FOLDER_MIME = "application/vnd.google-apps.folder"


def _esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def _find_child_folder(name: str):
    q = (f"'{PARENT_FOLDER_ID}' in parents and trashed=false "
         f"and mimeType='{FOLDER_MIME}' and name='{_esc(name)}'")
    resp = drive_svc().files().list(q=q, fields="files(id,name)", pageSize=5).execute()
    files = resp.get("files", [])
    return files[0]["id"] if files else None


def _find_by_event_id(eid: str):
    q = (f"'{PARENT_FOLDER_ID}' in parents and trashed=false "
         f"and mimeType='{FOLDER_MIME}' "
         f"and appProperties has {{ key='eventId' and value='{_esc(eid)}' }}")
    resp = drive_svc().files().list(q=q, fields="files(id,name)", pageSize=5).execute()
    files = resp.get("files", [])
    return files[0] if files else None


def _create_folder(name: str, eid: str | None = None) -> str:
    body = {"name": name, "mimeType": FOLDER_MIME, "parents": [PARENT_FOLDER_ID]}
    if eid:
        body["appProperties"] = {"eventId": eid}
    f = drive_svc().files().create(body=body, fields="id").execute()
    return f["id"]


def ensure_inbox() -> str:
    fid = _find_child_folder(INBOX_FOLDER_NAME)
    if fid:
        return fid
    if DRY_RUN:
        log(f"folders: would create inbox '{INBOX_FOLDER_NAME}'")
        return ""
    fid = _create_folder(INBOX_FOLDER_NAME)
    log(f"folders: created inbox '{INBOX_FOLDER_NAME}'")
    return fid


def _list_parent_folders():
    """All non-trashed subfolders of the parent, with creation time + appProps."""
    q = (f"'{PARENT_FOLDER_ID}' in parents and trashed=false "
         f"and mimeType='{FOLDER_MIME}'")
    out, token = [], None
    while True:
        resp = drive_svc().files().list(
            q=q, fields="nextPageToken,files(id,name,createdTime,appProperties)",
            pageSize=200, pageToken=token).execute()
        out += resp.get("files", [])
        token = resp.get("nextPageToken")
        if not token:
            break
    return out


def _children_count(fid: str) -> int:
    resp = drive_svc().files().list(
        q=f"'{fid}' in parents and trashed=false", fields="files(id)", pageSize=10
    ).execute()
    return len(resp.get("files", []))


def _folder_alive(fid: str) -> bool:
    """Direct confirm a folder is truly present (guards against acting on an
    incomplete list response before deleting derived data)."""
    try:
        meta = drive_svc().files().get(fileId=fid, fields="id,trashed").execute()
        return not meta.get("trashed", False)
    except Exception:
        return False


def _purge_gallery(database, doc_id, slug):
    """Hard-delete derived data for a gallery whose Drive folder is gone.
    Recovery path is Drive's own 30-day trash: restore the folder and the next
    sync rebuilds doc + photos from scratch."""
    bkt = bucket()
    # Storage blobs under galleries/{slug}/
    try:
        for blob in bkt.list_blobs(prefix=f"galleries/{slug}/"):
            blob.delete()
    except Exception as e:
        log(f"folders: storage cleanup issue for {slug}: {e}")
    # photos subcollection + the event doc
    photos = database.collection("events").document(doc_id).collection("photos")
    for p in photos.stream():
        p.reference.delete()
    database.collection("events").document(doc_id).delete()


def run(removed_events):
    database = db()
    col = database.collection("events")
    svc = drive_svc()
    today = dt.datetime.now(LA).date().isoformat()

    created = renamed = fixed = warned = adopted = purged = 0

    # --- 1. Cancelled UPCOMING events: orphan/trash FIRST so step 3 skips them.
    for ev in removed_events:
        fid = ev.get("folderId")
        if not fid:
            continue
        try:
            n = _children_count(fid)
        except Exception:
            continue
        if n == 0:
            if DRY_RUN:
                log(f"folders: would trash empty folder for cancelled '{ev.get('slug')}'")
            else:
                svc.files().update(fileId=fid, body={"trashed": True}).execute()
                log(f"folders: trashed empty folder for cancelled '{ev.get('slug')}'")
        else:
            name = f"_orphaned-{ev.get('folderName') or ev.get('slug')}"
            if DRY_RUN:
                log(f"folders: would orphan non-empty folder -> '{name}'")
            else:
                svc.files().update(fileId=fid, body={"name": name}).execute()
                log(f"folders: orphaned '{name}' ({n} items kept)")

    # --- 2. UPCOMING calendar docs: ensure/rename their folders from calendar.
    future_folder_ids = set()
    for doc in col.where("source", "==", "calendar").stream():
        d = doc.to_dict()
        if d.get("start", "") < today:
            continue  # past calendar event -> Drive owns it, handled in step 3
        want_name = f"{d['start']} {d['title']}".strip()
        fid = d.get("folderId")

        meta = None
        if fid:
            try:
                meta = svc.files().get(fileId=fid, fields="id,name,trashed").execute()
                if meta.get("trashed"):
                    meta = None
            except Exception:
                meta = None
        if not meta:  # re-bind by eventId if the folder exists but link was lost
            found = _find_by_event_id(doc.id)
            if found:
                meta = {"id": found["id"], "name": found["name"]}

        if not meta:
            if DRY_RUN:
                log(f"folders: would create '{want_name}'")
                continue
            new_id = _create_folder(want_name, doc.id)
            col.document(doc.id).update({"folderId": new_id, "folderName": want_name})
            future_folder_ids.add(new_id)
            created += 1
            continue

        future_folder_ids.add(meta["id"])
        updates = {}
        if meta["id"] != fid:
            updates["folderId"] = meta["id"]
        if meta["name"] != want_name:
            if DRY_RUN:
                log(f"folders: would rename '{meta['name']}' -> '{want_name}'")
            else:
                svc.files().update(fileId=meta["id"], body={"name": want_name}).execute()
                renamed += 1
        if updates and not DRY_RUN:
            updates["folderName"] = want_name
            col.document(doc.id).update(updates)
        elif meta["name"] != want_name and not DRY_RUN:
            col.document(doc.id).update({"folderName": want_name})

    # --- 3. DRIVE PASS: every other folder is a Drive-owned gallery.
    seen_doc_ids = set()
    for f in _list_parent_folders():
        name = f["name"]
        if name.startswith("_"):           # inbox / orphaned / system
            continue
        if f["id"] in future_folder_ids:   # calendar owns it (step 2)
            continue

        eid = (f.get("appProperties") or {}).get("eventId")
        doc_id = eid or f["id"]            # reuse calendar doc id if calendar-born
        seen_doc_ids.add(doc_id)

        parsed = parse_folder_name(name, f.get("createdTime"))
        # auto-fix unambiguous date problems by renaming the Drive folder
        if parsed["status"] == "fixed" and parsed["fixed_name"] and parsed["fixed_name"] != name:
            if DRY_RUN:
                log(f"folders: would fix date '{name}' -> '{parsed['fixed_name']}'")
            else:
                svc.files().update(fileId=f["id"], body={"name": parsed["fixed_name"]}).execute()
                log(f"folders: fixed date '{name}' -> '{parsed['fixed_name']}'")
            fixed += 1
            name = parsed["fixed_name"]
        elif parsed["status"] == "fallback":
            log(f"folders: WARNING '{name}' has no usable date prefix -- using "
                f"folder creation date {parsed['date']}; rename to "
                f"'YYYY-MM-DD {parsed['title']}' to set it explicitly")
            warned += 1

        slug = slug_for(parsed["date"], parsed["title"])
        doc_data = {
            "title": parsed["title"],
            "slug": slug,
            "type": type_for(parsed["title"]),
            "start": parsed["date"],
            "folderId": f["id"],
            "folderName": name,
            "source": "calendar" if eid else "drive",  # origin, not current owner
            "dateStatus": parsed["status"],
        }
        if DRY_RUN:
            verb = "adopt" if eid else "publish"
            log(f"folders: would {verb} gallery '{slug}'")
        else:
            # merge keeps end/location/description (calendar-born) + cover/photoCount
            col.document(doc_id).set(doc_data, merge=True)
        adopted += 1

    # --- 4. Delete Drive-owned docs whose folders vanished (with a safety check).
    for doc in col.where("source", "==", "calendar").stream():
        d = doc.to_dict()
        if d.get("start", "") >= today:
            continue  # upcoming calendar doc -> not Drive-owned, skip
        if doc.id in seen_doc_ids:
            continue
        fid = d.get("folderId")
        if fid and _folder_alive(fid):
            continue  # list was incomplete; folder really exists -> don't delete
        if DRY_RUN:
            log(f"folders: would remove gallery '{d.get('slug')}' (folder gone)")
        else:
            _purge_gallery(database, doc.id, d.get("slug"))
            log(f"folders: removed gallery '{d.get('slug')}' (folder gone)")
        purged += 1

    for doc in col.where("source", "==", "drive").stream():
        d = doc.to_dict()
        if doc.id in seen_doc_ids:
            continue
        fid = d.get("folderId")
        if fid and _folder_alive(fid):
            continue
        if DRY_RUN:
            log(f"folders: would remove manual gallery '{d.get('slug')}' (folder gone)")
        else:
            _purge_gallery(database, doc.id, d.get("slug"))
            log(f"folders: removed manual gallery '{d.get('slug')}' (folder gone)")
        purged += 1

    log(f"folders: created {created}, renamed {renamed}, date-fixed {fixed}, "
        f"warnings {warned}, galleries {adopted}, removed {purged}")
