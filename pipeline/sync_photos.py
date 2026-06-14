"""Drive event folders -> optimized images in Storage + Firestore photo docs.

Whatever is in an event's folder IS its public gallery: new files publish,
deleted files unpublish (Anna curates entirely by drag and drop in Drive).
EXIF is stripped (phone photos embed GPS), HEIC is converted, `cover.*`
becomes the event-card image, and an @H-V filename suffix (photo@50-25.jpg)
sets the crop focal point.
"""
import io
import re
from urllib.parse import quote

from PIL import Image, ImageOps
import pillow_heif
from googleapiclient.http import MediaIoBaseDownload

from .config import (DRY_RUN, FULL_MAX_PX, JPEG_QUALITY, STORAGE_BUCKET,
                     THUMB_MAX_PX, log)
from .gcp import bucket, db, drive_svc

pillow_heif.register_heif_opener()

FOCAL_RE = re.compile(r"@(\d{1,3})-(\d{1,3})(?=\.[A-Za-z0-9]+$)")


def public_url(path: str) -> str:
    return f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o/{quote(path, safe='')}?alt=media"


def _list_images(folder_id: str):
    q = f"'{folder_id}' in parents and trashed=false and mimeType contains 'image/'"
    files, token = [], None
    while True:
        resp = drive_svc().files().list(
            q=q, fields="nextPageToken,files(id,name,md5Checksum,mimeType)",
            pageSize=200, pageToken=token).execute()
        files += resp.get("files", [])
        token = resp.get("nextPageToken")
        if not token:
            break
    return files


def _download(file_id: str) -> bytes:
    buf = io.BytesIO()
    req = drive_svc().files().get_media(fileId=file_id)
    dl = MediaIoBaseDownload(buf, req)
    done = False
    while not done:
        _, done = dl.next_chunk()
    return buf.getvalue()


def _process(raw: bytes):
    img = Image.open(io.BytesIO(raw))
    img = ImageOps.exif_transpose(img)  # honor rotation, then EXIF is dropped on save
    img = img.convert("RGB")
    w, h = img.size

    def encode(max_px):
        copy = img.copy()
        copy.thumbnail((max_px, max_px), Image.LANCZOS)
        out = io.BytesIO()
        copy.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True)
        return out.getvalue()

    return encode(FULL_MAX_PX), encode(THUMB_MAX_PX), w, h


def _focus_from_name(name: str):
    m = FOCAL_RE.search(name)
    return f"{m.group(1)}% {m.group(2)}%" if m else None


def run():
    database = db()
    bkt = bucket()
    events = list(database.collection("events").where("source", "==", "calendar").stream())
    total_new = total_gone = 0

    for doc in events:
        d = doc.to_dict()
        folder_id, slug = d.get("folderId"), d.get("slug")
        if not folder_id or not slug:
            continue

        drive_files = {f["id"]: f for f in _list_images(folder_id)}
        photos_col = database.collection("events").document(doc.id).collection("photos")
        existing = {p.id: p.to_dict() for p in photos_col.stream()}

        # new or changed
        for fid, f in drive_files.items():
            if fid in existing and existing[fid].get("md5") == f.get("md5Checksum"):
                continue
            if DRY_RUN:
                log(f"photos: would publish {slug}/{f['name']}")
                total_new += 1
                continue
            full, thumb, w, h = _process(_download(fid))
            base = f"galleries/{slug}/{fid}"
            blob_f = bkt.blob(f"{base}.jpg")
            blob_f.upload_from_string(full, content_type="image/jpeg")
            blob_f.cache_control = "public,max-age=31536000"
            blob_f.patch()
            blob_t = bkt.blob(f"{base}_thumb.jpg")
            blob_t.upload_from_string(thumb, content_type="image/jpeg")
            blob_t.cache_control = "public,max-age=31536000"
            blob_t.patch()
            photos_col.document(fid).set({
                "fileId": fid,
                "name": f["name"],
                "order": f["name"].lower(),
                "url": public_url(f"{base}.jpg"),
                "thumbUrl": public_url(f"{base}_thumb.jpg"),
                "w": w, "h": h,
                "focus": _focus_from_name(f["name"]),
                "md5": f.get("md5Checksum"),
            })
            total_new += 1
            log(f"photos: published {slug}/{f['name']}")

        # deletions (Anna removed it from the folder)
        for fid in set(existing) - set(drive_files):
            if DRY_RUN:
                log(f"photos: would unpublish {slug}/{existing[fid].get('name')}")
            else:
                for suffix in (".jpg", "_thumb.jpg"):
                    try:
                        bkt.blob(f"galleries/{slug}/{fid}{suffix}").delete()
                    except Exception:
                        pass
                photos_col.document(fid).delete()
                log(f"photos: unpublished {slug}/{existing[fid].get('name')}")
            total_gone += 1

        # cover + count on the event doc
        if not DRY_RUN:
            final = sorted(photos_col.stream(), key=lambda p: p.to_dict().get("order", ""))
            final_d = [p.to_dict() for p in final]
            cover = next((p for p in final_d if p["name"].lower().startswith("cover.")),
                         final_d[0] if final_d else None)
            database.collection("events").document(doc.id).set({
                "photoCount": len(final_d),
                "coverUrl": cover["url"] if cover else None,
                "coverThumb": cover["thumbUrl"] if cover else None,
                "focus": (cover.get("focus") if cover else None),
            }, merge=True)

    log(f"photos: {total_new} published, {total_gone} unpublished across {len(events)} events")
