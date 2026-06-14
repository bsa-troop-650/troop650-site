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
from .gcp import db
from .oauth_drive import oauth_drive_svc

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
    oauth_drive_svc().files().create(
        body={"name": fname, "parents": [inbox_id]}, media_body=media, fields="id"
    ).execute()


def _process_messages(msgs, inbox_id, channel_label="main"):
    """Download image attachments and upload to the Drive inbox.

    Filename format: YYYY-MM-DD_ChannelLabel_Sender_msgid_N.jpg
    e.g. 2026-06-11_SanMateo_Maria_msg12345_1.jpg (topic)
         2026-06-11_main_Maria_msg12345_1.jpg     (main chat)
    """
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
                log(f"groupme: would import {day}_{channel_label}_{sender}_{m['id']}_{i}")
                count += 1
                continue
            resp = requests.get(url, timeout=60)
            resp.raise_for_status()
            mime = resp.headers.get("Content-Type", "image/jpeg").split(";")[0]
            ext = {"image/png": "png", "image/gif": "gif"}.get(mime, "jpg")
            fname = f"{day}_{channel_label}_{sender}_{m['id']}_{i}.{ext}"
            _upload_to_inbox(inbox_id, fname, resp.content, mime)
            count += 1
            log(f"groupme: imported {fname}")
    return count


def _pull_channel(channel_id, channel_label, state_key, inbox_id, cutoff=None):
    """Pull images from one channel (main chat or a topic subgroup).

    channel_id    — GroupMe group or subgroup ID
    channel_label — short name embedded in filenames, e.g. "main" or "SanMateo"
    state_key     — Firestore key storing last_id for this channel
    inbox_id      — Drive folder to upload into
    cutoff        — unix timestamp; if set, only import messages newer than this
                    (used for backfill mode — normal incremental uses after_id instead)

    Returns (total_images_imported, newest_id_seen).
    """
    state_ref = db().collection("pipeline").document("groupme")
    state = state_ref.get().to_dict() or {}
    last_id = state.get(state_key)
    total = 0
    newest_seen = last_id

    if not last_id:
        # First time seeing this channel: record baseline, optionally backfill.
        latest = _get(f"/groups/{channel_id}/messages", limit=1) or {}
        newest = (latest.get("messages") or [{}])[0].get("id")
        if cutoff and newest:
            collected, before = [], None
            while True:
                resp = _get(f"/groups/{channel_id}/messages", limit=100,
                            **({"before_id": before} if before else {}))
                msgs = (resp or {}).get("messages") or []
                if not msgs:
                    break
                keep = [m for m in msgs if m["created_at"] >= cutoff]
                collected += keep
                if len(keep) < len(msgs):
                    break
                before = msgs[-1]["id"]
            total = _process_messages(list(reversed(collected)), inbox_id,
                                      channel_label=channel_label)
            log(f"groupme: backfilled {total} images from '{channel_label}'")
        else:
            log(f"groupme: first run for '{channel_label}' — baseline recorded")
        if newest and not DRY_RUN:
            state_ref.set({state_key: newest}, merge=True)
        return total, newest

    # Incremental: pull everything since last_id.
    while True:
        resp = _get(f"/groups/{channel_id}/messages", limit=100, after_id=last_id)
        msgs = (resp or {}).get("messages") or []
        if not msgs:
            break
        total += _process_messages(msgs, inbox_id, channel_label=channel_label)
        last_id = msgs[-1]["id"]
        newest_seen = last_id
        if not DRY_RUN:
            state_ref.set({state_key: last_id}, merge=True)

    return total, newest_seen


def run(inbox_id):
    if not TOKEN:
        log("groupme: GROUPME_TOKEN not set — skipping")
        return
    if not inbox_id:
        log("groupme: no inbox folder id (dry run before creation?) — skipping")
        return

    gid = _find_group_id()
    cutoff = (dt.datetime.now().timestamp() - BACKFILL_DAYS * 86400
              if BACKFILL_DAYS > 0 else None)

    grand_total = 0

    # Main chat.
    n, _ = _pull_channel(gid, "main", "last_id", inbox_id, cutoff=cutoff)
    grand_total += n

    # Topics / subgroups — pull each independently with its own state key.
    try:
        subs = _get(f"/groups/{gid}/subgroups") or []
        if not isinstance(subs, list):
            raise ValueError("unexpected shape")
        log(f"groupme: {len(subs)} topics found")
        for sub in subs:
            sid = sub.get("id") or sub.get("group_id")
            raw_name = (sub.get("name") or sub.get("topic") or f"topic-{sid}").strip()
            # Sanitize topic name for filename use: keep alphanum + spaces -> CamelCase.
            label = re.sub(r"[^A-Za-z0-9 ]+", "", raw_name)
            label = "".join(w.capitalize() for w in label.split()) or f"topic{sid}"
            state_key = f"last_id_topic_{sid}"
            n, _ = _pull_channel(sid, label, state_key, inbox_id, cutoff=cutoff)
            grand_total += n
    except Exception as e:
        log(f"groupme: topics pull failed ({e}) — main chat only")

    log(f"groupme: imported {grand_total} new images total")