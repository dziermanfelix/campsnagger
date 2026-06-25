from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from campgrounds import CAMPGROUNDS
from recreation import RecreationGovError, fetch_campground_availability, parse_sites

app = FastAPI()


class CampgroundResponse(BaseModel):
    slug: str
    id: str
    name: str


class SiteResponse(BaseModel):
    campsite_id: str
    site_number: str
    loop: str
    campsite_type: str
    has_availability: bool
    available_dates: list[str]
    site_url: str


class AvailabilityResponse(BaseModel):
    campground_id: str
    campground_slug: str
    campground_name: str
    start_date: str
    sites: list[SiteResponse]


@app.get("/campgrounds", response_model=list[CampgroundResponse])
def list_campgrounds():
    return [
        CampgroundResponse(slug=slug, id=info["id"], name=info["name"])
        for slug, info in CAMPGROUNDS.items()
    ]


@app.get("/campgrounds/{slug}/availability", response_model=AvailabilityResponse)
def get_campground_availability(
    slug: str,
    start_date: str = Query(default="2026-08-01"),
):
    campground = CAMPGROUNDS.get(slug)
    if campground is None:
        raise HTTPException(status_code=404, detail=f"Unknown campground: {slug}")

    try:
        raw_data = fetch_campground_availability(campground["id"], start_date)
    except RecreationGovError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    sites = parse_sites(raw_data)

    return AvailabilityResponse(
        campground_id=campground["id"],
        campground_slug=slug,
        campground_name=campground["name"],
        start_date=start_date.split("T")[0],
        sites=[SiteResponse(**site.__dict__) for site in sites],
    )
