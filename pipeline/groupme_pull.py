"""GroupMe -> Drive _inbox-to-sort.

Pulls new image attachments from the troop GroupMe and drops the ORIGINALS
into the Drive inbox folder, named "YYYY-MM-DD_Sender_msgid_N.jpg" so Anna
has context while sorting. Nothing here touches the public site — photos only
publish after Anna moves them into an event folder.

First run records a baseline (newest message id) and imports nothing, so we
don't flood the inbox with years of history. Deliberate history pulls:
workflow input groupme_backfill_days.

Topics: the group has Main Chat + topics; topic reading is attempted via the
subgroups endpoint and logged — if GroupMe's API doesn't expose them, main
chat still works and we revisit.
"""
import datetime as dt
import io
import os
import re

import requests
from googleapiclient.http import MediaIoBaseUpload

from .config import DRY_RUN, GROUPME_GROUP_NAME, log
from .gcp import db, drive_svc

API = "https://api.groupme.com/v3"
TOKEN = os.environ.get("GROUPME_TOKEN", "")
BACKFILL_DAYS = int(os.environ.get("GROUPME_BACKFILL_DAYS") or 0)


def _get(path, **params):
    params["token"] = TOKEN
    r = requests.get(f"{API}{path}", params=params, timeout=30)
    if r.status_code == 304:  # no new messages
        return None
    r.raise_for_status()
    return r.json().get("response")


def _find_group_id():
    override = os.environ.get("GROUPME_GROUP_ID")
    if override:
        return override
    page = 1
    while True:
        groups = _get("/groups", per_page=100, page=page) or []
        if not groups:
            raise RuntimeError(f"GroupMe group named '{GROUPME_GROUP_NAME}' not found")
        for g in groups:
            if g.get("name", "").strip() == GROUPME_GROUP_NAME:
                return g["group_id"]
        page += 1


def _sanitize(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "", (name or "Someone").split()[0]) or "Someone"


def _upload_to_inbox(inbox_id, fname, data, mime):
    media = MediaIoBaseUpload(io.BytesIO(data), mimetype=mime, resumable=False)
    drive_svc().files().create(
        body={"name": fname, "parents": [inbox_id]}, media_body=media, fields="id"
    ).execute()


def _process_messages(msgs, inbox_id):
    count = 0
    for m in msgs:
        images = [a for a in (m.get("attachments") or []) if a.get("type") == "image"]
        if not images:
            continue
        day = dt.datetime.fromtimestamp(m["created_at"]).date().isoformat()
        sender = _sanitize(m.get("name"))
        for i, att in enumerate(images, 1):
            url = att["url"]
            if DRY_RUN:
                log(f"groupme: would import {day}_{sender}_{m['id']}_{i}")
                count += 1
                continue
            resp = requests.get(url, timeout=60)
            resp.raise_for_status()
            mime = resp.headers.get("Content-Type", "image/jpeg").split(";")[0]
            ext = {"image/png": "png", "image/gif": "gif"}.get(mime, "jpg")
            fname = f"{day}_{sender}_{m['id']}_{i}.{ext}"
            _upload_to_inbox(inbox_id, fname, resp.content, mime)
            count += 1
            log(f"groupme: imported {fname}")
    return count


def run(inbox_id):
    if not TOKEN:
        log("groupme: GROUPME_TOKEN not set — skipping")
        return
    if not inbox_id:
        log("groupme: no inbox folder id (dry run before creation?) — skipping")
        return

    gid = _find_group_id()
    state_ref = db().collection("pipeline").document("groupme")
    state = state_ref.get().to_dict() or {}
    last_id = state.get("last_id")

    if not last_id:
        latest = _get(f"/groups/{gid}/messages", limit=1) or {}
        newest = (latest.get("messages") or [{}])[0].get("id")
        if BACKFILL_DAYS > 0 and newest:
            cutoff = dt.datetime.now().timestamp() - BACKFILL_DAYS * 86400
            collected, before = [], None
            while True:
                resp = _get(f"/groups/{gid}/messages", limit=100,
                            **({"before_id": before} if before else {}))
                msgs = (resp or {}).get("messages") or []
                if not msgs:
                    break
                keep = [m for m in msgs if m["created_at"] >= cutoff]
                collected += keep
                if len(keep) < len(msgs):
                    break
                before = msgs[-1]["id"]
            n = _process_messages(list(reversed(collected)), inbox_id)
            log(f"groupme: backfilled {n} images from {BACKFILL_DAYS} days")
        else:
            log("groupme: first run — baseline recorded, importing nothing")
        if newest and not DRY_RUN:
            state_ref.set({"last_id": newest}, merge=True)
        return

    total = 0
    while True:
        resp = _get(f"/groups/{gid}/messages", limit=100, after_id=last_id)
        msgs = (resp or {}).get("messages") or []
        if not msgs:
            break
        total += _process_messages(msgs, inbox_id)
        last_id = msgs[-1]["id"]
        if not DRY_RUN:
            state_ref.set({"last_id": last_id}, merge=True)

    # Topics (experimental): log what the API exposes so we know for next time.
    try:
        subs = _get(f"/groups/{gid}/subgroups") or []
        log(f"groupme: topics visible via API: {len(subs)}" if isinstance(subs, list)
            else "groupme: subgroups endpoint returned unexpected shape")
    except Exception as e:
        log(f"groupme: topics endpoint not available ({e}) — main chat only")

    log(f"groupme: imported {total} new images")
