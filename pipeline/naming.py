"""Folder-name parsing + slug/type helpers shared across the pipeline.

Slug output MUST stay byte-identical to slugFor() in src/data/adventures.js so
gallery URLs resolve across the static->Firestore boundary and across the
calendar->Drive ownership handoff.

Folder names follow "YYYY-MM-DD Title". We parse the date prefix for
sorting/display. Trivially-malformed dates (missing zero-padding, e.g.
"2026-4-27") are auto-corrected and the Drive folder is renamed. Anything we
can't unambiguously fix (no date, gibberish date, impossible date like
2026-13-45) falls back to the folder's creation date and is flagged for a human
-- we never guess a date, because a confidently-wrong date is worse than a
visibly-needs-attention one.
"""
import datetime as dt
import re

from .config import TYPE_MAP

# Date must be a prefix. Separator after the date may be a space or underscore;
# \b covers the space case, the explicit _ covers the underscore case (since _
# is a word char and wouldn't trigger \b).
ISO_PREFIX_RE = re.compile(r"^(\d{4})-(\d{1,2})-(\d{1,2})(?:\b|_)\s*(.*)$", re.DOTALL)


def slugify(title: str) -> str:
    # Mirrors: name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def slug_for(date_str: str, title: str) -> str:
    return f"{date_str}_{slugify(title)}"


def type_for(title: str) -> str:
    t = title.lower()
    for key, pretty in TYPE_MAP:
        if re.search(r"\b" + re.escape(key), t):
            return pretty
    return "Adventure"


def _created_date(created_time: str | None) -> str:
    """Drive createdTime (RFC3339, e.g. '2026-06-15T06:41:00.000Z') -> YYYY-MM-DD.
    Last-resort fallback date when a folder name carries no usable date."""
    if created_time and len(created_time) >= 10:
        return created_time[:10]
    return dt.date.today().isoformat()


def parse_folder_name(name: str, created_time: str | None = None) -> dict:
    """Parse a gallery folder name.

    Returns {date, title, status, fixed_name}:
      status 'ok'       -> clean YYYY-MM-DD prefix
      status 'fixed'    -> valid date needed zero-padding; fixed_name is the
                           corrected folder name the caller should rename to
      status 'fallback' -> no usable date; date = folder creation date, title =
                           whole name, caller should log a warning
    """
    s = name.strip()
    m = ISO_PREFIX_RE.match(s)
    if m:
        y, mo, d, rest = m.groups()
        rest = rest.strip()
        try:
            date = dt.date(int(y), int(mo), int(d))
        except ValueError:
            # Shaped like a date but impossible (2026-13-45). Don't guess.
            return {"date": _created_date(created_time), "title": rest or s,
                    "status": "fallback", "fixed_name": None}
        date_str = date.isoformat()
        title = rest or s
        if len(mo) == 1 or len(d) == 1:
            fixed = f"{date_str} {rest}".strip()
            return {"date": date_str, "title": title, "status": "fixed",
                    "fixed_name": fixed}
        return {"date": date_str, "title": title, "status": "ok", "fixed_name": None}
    # No date prefix at all.
    return {"date": _created_date(created_time), "title": s,
            "status": "fallback", "fixed_name": None}
