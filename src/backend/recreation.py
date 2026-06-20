from dataclasses import dataclass

import requests

BASE_URL = "https://www.recreation.gov/api/camps/availability/campground"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}


@dataclass
class SiteAvailability:
    campsite_id: str
    site_number: str
    loop: str
    campsite_type: str
    has_availability: bool
    icon: str
    available_dates: list[str]


class RecreationGovError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def normalize_start_date(start_date: str) -> str:
    if "T" in start_date:
        return start_date
    return f"{start_date}T00:00:00.000Z"


def fetch_campground_availability(campground_id: str, start_date: str) -> dict:
    url = f"{BASE_URL}/{campground_id}/month"
    params = {"start_date": normalize_start_date(start_date)}
    headers = {**HEADERS, "Referer": f"https://recreation.gov{campground_id}"}

    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
    except requests.RequestException as e:
        raise RecreationGovError(f"Failed to reach recreation.gov: {e}") from e

    if response.status_code != 200:
        raise RecreationGovError(
            f"recreation.gov returned status {response.status_code}",
            status_code=response.status_code,
        )

    return response.json()


def parse_sites(raw_data: dict) -> list[SiteAvailability]:
    campsites = raw_data.get("campsites", {})
    sites: list[SiteAvailability] = []

    for site_id, site_details in campsites.items():
        availabilities = site_details.get("availabilities", {})
        available_dates = sorted(
            date_str.split("T")[0]
            for date_str, status in availabilities.items()
            if status == "Available"
        )
        has_availability = len(available_dates) > 0

        sites.append(
            SiteAvailability(
                campsite_id=site_id,
                site_number=site_details.get("site", ""),
                loop=site_details.get("loop", ""),
                campsite_type=site_details.get("campsite_type", ""),
                has_availability=has_availability,
                icon="🍻" if has_availability else "💩",
                available_dates=available_dates,
            )
        )

    sites.sort(key=lambda s: s.site_number)
    return sites
