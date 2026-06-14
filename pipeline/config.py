"""Shared pipeline configuration. Edit keyword list / IDs here."""
import os

CALENDAR_ID = "troop650rc@gmail.com"          # troop primary calendar
PARENT_FOLDER_ID = "12JYrIsq5ilzDyIpuZ36xCJVWQwfictv2"  # Drive photo root
INBOX_FOLDER_NAME = "_inbox-to-sort"          # GroupMe pull lands here for Anna
STORAGE_BUCKET = "troop650.firebasestorage.app"
GROUPME_GROUP_NAME = os.environ.get("GROUPME_GROUP_NAME", "2024 Troop 650")

# Whitelist: an event is an "adventure" (public on the site) only if its title
# contains one of these (case-insensitive) AND doesn't start with [Booking].
# Better to miss one than to publish something that shouldn't be.
ADVENTURE_KEYWORDS = [
    "camp", "camporee", "jamboree", "hike", "backpack", "climb",
    "canoe", "kayak", "raft", "sail", "fish", "bike", "cycl", "ski", "snow",
]

# Pretty event-type chip for the site cards, first match wins.
TYPE_MAP = [
    ("summer camp", "Summer Camp"), ("camporee", "Camporee"), ("jamboree", "Jamboree"),
    ("family camp", "Family Campout"), ("camp", "Campout"), ("hike", "Hike"),
    ("backpack", "Backpacking"), ("climb", "Climbing"), ("canoe", "On the Water"),
    ("kayak", "On the Water"), ("raft", "On the Water"), ("sail", "On the Water"),
    ("fish", "Fishing"), ("bike", "Cycling"), ("cycl", "Cycling"),
    ("ski", "Snow"), ("snow", "Snow"),
]

TZ = "America/Los_Angeles"
LOOKBACK_DAYS = 550     # how much history stays synced (galleries)
LOOKAHEAD_DAYS = 400    # how far ahead to publish upcoming adventures

# Image processing
FULL_MAX_PX = 1600
THUMB_MAX_PX = 400
JPEG_QUALITY = 82

DRY_RUN = os.environ.get("DRY_RUN", "").lower() in ("1", "true", "yes")

def log(msg):
    print(("[dry] " if DRY_RUN else "") + msg, flush=True)
