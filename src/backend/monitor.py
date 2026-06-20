import time

from backend.recreation import fetch_campground_availability, parse_sites

CAMPGROUND_ID = "232447"
START_DATE = "2026-08-01"


def check_campsite_openings():
    try:
        raw_data = fetch_campground_availability(CAMPGROUND_ID, START_DATE)
        sites = parse_sites(raw_data)

        found_availabilities = False
        for site in sites:
            if not site.has_availability:
                continue
            for date in site.available_dates:
                print(f"OPENING DETECTED! Site #{site.site_number} is available on {date}")
                found_availabilities = True

        if not found_availabilities:
            print("No openings found right now.")

    except Exception as e:
        print(f"An exception occurred: {e}")


if __name__ == "__main__":
    print(f"Starting loop for Campground ID {CAMPGROUND_ID}...")
    while True:
        check_campsite_openings()
        time.sleep(300)
