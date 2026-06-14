"""Nightly orchestrator: calendar -> folders -> photos -> GroupMe inbox.
Steps run independently; any failure is collected and fails the job at the
end so GitHub Actions surfaces it without one step blocking the rest."""
import sys
import traceback

from .config import DRY_RUN, log
from . import sync_calendar, sync_folders, sync_photos, groupme_pull

def main():
    errors = []
    removed = []

    log(f"=== Troop 650 nightly sync (dry_run={DRY_RUN}) ===")

    try:
        _, removed = sync_calendar.run()
    except Exception:
        errors.append("calendar"); traceback.print_exc()

    inbox_id = ""
    try:
        inbox_id = sync_folders.ensure_inbox()
        sync_folders.run(removed)
    except Exception:
        errors.append("folders"); traceback.print_exc()

    try:
        sync_photos.run()
    except Exception:
        errors.append("photos"); traceback.print_exc()

    try:
        groupme_pull.run(inbox_id)
    except Exception:
        errors.append("groupme"); traceback.print_exc()

    if errors:
        log(f"=== finished WITH ERRORS in: {', '.join(errors)} ===")
        sys.exit(1)
    log("=== finished clean ===")

if __name__ == "__main__":
    main()
