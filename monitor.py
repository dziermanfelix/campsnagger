import time
import requests

CAMPGROUND_ID = "232450"
START_DATE = "2026-08-01T00:00:00.000Z"

url = f"https://www.recreation.gov/api/camps/availability/campground/{CAMPGROUND_ID}/month"

params = {
    "start_date": START_DATE
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": f"https://recreation.gov{CAMPGROUND_ID}"
}


def check_campsite_openings():
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)

        if response.status_code != 200:
            print(f"Error fetching data: Status Code {response.status_code}")
            return

        data = response.json()
        campsites = data.get("campsites", {})

        found_availabilities = False

        for site_id, site_details in campsites.items():
            site_number = site_details.get("site")
            availabilities = site_details.get("availabilities", {})

            for date_str, status in availabilities.items():
                if status == "Available":
                    clean_date = date_str.split("T")[0]
                    print(f"OPENING DETECTED! Site #{site_number} is available on {clean_date}")
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
