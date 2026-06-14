"""Drive folder lifecycle for adventure events.

One folder per adventure under the parent photo root, named
"YYYY-MM-DD Title". Folders carry appProperties.eventId so they survive
renames and can be re-bound if Firestore ever loses the folderId. Removed
future events: empty folders are trashed; folders with content are renamed
with an _orphaned- prefix and left for a human (never auto-delete photos).
"""
from .config import DRY_RUN, INBOX_FOLDER_NAME, PARENT_FOLDER_ID, log
from .gcp import db, drive_svc

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


def _children_count(fid: str) -> int:
    resp = drive_svc().files().list(
        q=f"'{fid}' in parents and trashed=false", fields="files(id)", pageSize=10
    ).execute()
    return len(resp.get("files", []))


def run(removed_events):
    database = db()
    col = database.collection("events")
    svc = drive_svc()
    created = renamed = 0

    for doc in col.where("source", "==", "calendar").stream():
        d = doc.to_dict()
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
        if not meta:  # re-bind by eventId if folder exists but link was lost
            found = _find_by_event_id(doc.id)
            if found:
                meta = {"id": found["id"], "name": found["name"]}

        if not meta:
            if DRY_RUN:
                log(f"folders: would create '{want_name}'")
                continue
            new_id = _create_folder(want_name, doc.id)
            col.document(doc.id).update({"folderId": new_id, "folderName": want_name})
            created += 1
            continue

        updates = {}
        if meta["id"] != fid:
            updates["folderId"] = meta["id"]
        if meta["name"] != want_name:
            if DRY_RUN:
                log(f"folders: would rename '{meta['name']}' -> '{want_name}'")
            else:
                svc.files().update(fileId=meta["id"], body={"name": want_name}).execute()
                renamed += 1
        if (updates or meta["name"] != want_name) and not DRY_RUN:
            updates["folderName"] = want_name
            col.document(doc.id).update(updates)

    # Orphan handling for events removed from the calendar
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
                log(f"folders: would trash empty folder for {ev.get('slug')}")
            else:
                svc.files().update(fileId=fid, body={"trashed": True}).execute()
                log(f"folders: trashed empty folder for {ev.get('slug')}")
        else:
            name = f"_orphaned-{ev.get('folderName') or ev.get('slug')}"
            if DRY_RUN:
                log(f"folders: would orphan non-empty folder -> '{name}'")
            else:
                svc.files().update(fileId=fid, body={"name": name}).execute()
                log(f"folders: orphaned '{name}' ({n} items kept)")

    log(f"folders: created {created}, renamed {renamed}")
