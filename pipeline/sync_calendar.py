"""Calendar -> Firestore `events` (UPCOMING adventures only).

Authority model: the calendar owns an adventure until its START date passes.
While an event is still upcoming, calendar edits propagate (a rename re-titles
the gallery, deleting the event removes its folder/gallery). The moment the
start date passes, the event is handed off to Drive -- sync_folders takes over,
the folder name becomes authoritative, and this module never touches it again.

So this module only ever upserts/reconciles events whose start is today or
later. A doc's `source` stays "calendar" forever (it records origin, not who
currently owns it) so the site's upcoming/recent split stays clean.
"""
import datetime as dt
import re
from zoneinfo import ZoneInfo

from .config import (ADVENTURE_KEYWORDS, CALENDAR_ID, DRY_RUN, LOOKAHEAD_DAYS,
                     LOOKBACK_DAYS, TZ, log)
from .gcp import calendar_svc, db
from .naming import slug_for, type_for

LA = ZoneInfo(TZ)

# Keywords match at word starts only ("raft" hits "rafting" but not "Minecraft").
_KW_RE = re.compile(r"\b(?:" + "|".join(ADVENTURE_KEYWORDS) + r")")


def is_adventure(title: str) -> bool:
    t = title.lower().strip()
    if t.startswith("[booking]"):
        return False
    return bool(_KW_RE.search(t))


def _local_date(when: dict) -> str:
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
    today = dt.datetime.now(LA).date().isoformat()
    raw = fetch_window()

    # Only future/starting-today adventures are calendar-managed.
    upcoming = {}
    for e in raw:
        if e.get("status") == "cancelled":
            continue
        if not is_adventure(e.get("summary") or ""):
            continue
        data = normalize(e)
        if data["start"] >= today:
            upcoming[e["id"]] = data

    log(f"calendar: {len(raw)} events in window, {len(upcoming)} upcoming adventures")

    database = db()
    col = database.collection("events")

    for eid, data in upcoming.items():
        if DRY_RUN:
            log(f"calendar: would upsert {data['slug']}")
        else:
            # merge keeps folderId / coverUrl / photoCount written by other steps
            col.document(eid).set(data, merge=True)

    # Reconcile cancellations. A doc that is source=calendar and STILL future
    # (stored start >= today) but no longer on the calendar = cancelled -> delete.
    # Docs whose stored start has passed are deliberately left alone: Drive owns
    # them now, and deleting here would fight the Drive pass.
    removed = []
    for doc in col.where("source", "==", "calendar").stream():
        d = doc.to_dict()
        if d.get("start", "") >= today and doc.id not in upcoming:
            removed.append({"id": doc.id, **d})
            if DRY_RUN:
                log(f"calendar: would remove cancelled upcoming '{d.get('slug')}'")
            else:
                col.document(doc.id).delete()

    log(f"calendar: upserted {len(upcoming)} upcoming, removed {len(removed)} cancelled")
    return list(upcoming.keys()), removed
