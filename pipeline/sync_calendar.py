"""Calendar -> Firestore `events` collection.

Reads the troop calendar, keeps only whitelist-matched adventures, and upserts
them keyed by calendar event ID (stable across renames). Future events that
vanish from the calendar are removed (their Drive folders get orphan-handled
by sync_folders); past events are immutable history and are never auto-deleted.
"""
import datetime as dt
import re
from zoneinfo import ZoneInfo

from .config import (ADVENTURE_KEYWORDS, CALENDAR_ID, DRY_RUN, LOOKAHEAD_DAYS,
                     LOOKBACK_DAYS, TYPE_MAP, TZ, log)
from .gcp import calendar_svc, db

LA = ZoneInfo(TZ)


def slugify(title: str) -> str:
    # Must match slugFor() in src/data/adventures.js exactly.
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def slug_for(start: str, title: str) -> str:
    return f"{start}_{slugify(title)}"


# Keywords match at word starts only ("raft" hits "rafting" but not
# "Minecraft"); stems still work (camp -> campout/camping, cycl -> cycling).
_KW_RE = re.compile(r"\b(?:" + "|".join(ADVENTURE_KEYWORDS) + r")")


def is_adventure(title: str) -> bool:
    t = title.lower().strip()
    if t.startswith("[booking]"):
        return False
    return bool(_KW_RE.search(t))


def type_for(title: str) -> str:
    t = title.lower()
    for key, pretty in TYPE_MAP:
        if re.search(r"\b" + re.escape(key), t):
            return pretty
    return "Adventure"


def _local_date(when: dict) -> str:
    """Calendar start/end object -> local YYYY-MM-DD."""
    if "date" in when:  # all-day
        return when["date"]
    d = dt.datetime.fromisoformat(when["dateTime"])
    return d.astimezone(LA).date().isoformat()


def normalize(ev: dict) -> dict:
    title = (ev.get("summary") or "").strip()
    start = _local_date(ev["start"])
    end = _local_date(ev["end"])
    if "date" in ev["end"]:  # all-day end is exclusive -> make inclusive
        end = (dt.date.fromisoformat(end) - dt.timedelta(days=1)).isoformat()
    if end <= start:
        end = None
    return {
        "title": title,
        "slug": slug_for(start, title),
        "type": type_for(title),
        "start": start,
        "end": end,
        "location": (ev.get("location") or "").strip(),
        "description": (ev.get("description") or "").strip()[:2000],
        "source": "calendar",
    }


def fetch_window():
    now = dt.datetime.now(dt.timezone.utc)
    t_min = (now - dt.timedelta(days=LOOKBACK_DAYS)).isoformat()
    t_max = (now + dt.timedelta(days=LOOKAHEAD_DAYS)).isoformat()
    svc = calendar_svc()
    items, token = [], None
    while True:
        resp = svc.events().list(
            calendarId=CALENDAR_ID, timeMin=t_min, timeMax=t_max,
            singleEvents=True, orderBy="startTime", maxResults=250,
            pageToken=token,
        ).execute()
        items += resp.get("items", [])
        token = resp.get("nextPageToken")
        if not token:
            break
    return items


def run():
    raw = fetch_window()
    adventures = {e["id"]: normalize(e) for e in raw
                  if e.get("status") != "cancelled" and is_adventure(e.get("summary") or "")}
    log(f"calendar: {len(raw)} events in window, {len(adventures)} adventures")

    database = db()
    col = database.collection("events")

    for eid, data in adventures.items():
        if DRY_RUN:
            log(f"calendar: would upsert {data['slug']}")
        else:
            col.document(eid).set(data, merge=True)  # merge keeps folderId/cover/photoCount

    # Reconcile: future-dated docs no longer on the calendar -> removed.
    today = dt.datetime.now(LA).date().isoformat()
    removed = []
    for doc in col.where("source", "==", "calendar").stream():
        d = doc.to_dict()
        if d.get("start", "") >= today and doc.id not in adventures:
            removed.append({"id": doc.id, **d})
            if DRY_RUN:
                log(f"calendar: would remove future event {d.get('slug')}")
            else:
                col.document(doc.id).delete()
    log(f"calendar: upserted {len(adventures)}, removed {len(removed)} future events")
    return list(adventures.keys()), removed
