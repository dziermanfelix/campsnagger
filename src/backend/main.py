from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from backend.recreation import RecreationGovError, fetch_campground_availability, parse_sites

app = FastAPI(title="Campsnagger", description="Campsite availability lookup")

UPPER_PINES_ID = "232447"


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


class SiteResponse(BaseModel):
    campsite_id: str
    site_number: str
    loop: str
    campsite_type: str
    has_availability: bool
    icon: str
    available_dates: list[str]


class AvailabilityResponse(BaseModel):
    campground_id: str
    start_date: str
    site_count: int
    available_count: int
    sites: list[SiteResponse]


def build_availability_response(campground_id: str, start_date: str) -> AvailabilityResponse:
    try:
        raw_data = fetch_campground_availability(campground_id, start_date)
    except RecreationGovError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    sites = parse_sites(raw_data)
    clean_start_date = start_date.split("T")[0]

    return AvailabilityResponse(
        campground_id=campground_id,
        start_date=clean_start_date,
        site_count=len(sites),
        available_count=sum(1 for s in sites if s.has_availability),
        sites=[SiteResponse(**site.__dict__) for site in sites],
    )


@app.get("/upper-pines/availability", response_model=AvailabilityResponse)
def get_upper_pines_availability(
    start_date: str = Query(default="2026-08-01", description="Start date (YYYY-MM-DD)"),
):
    return build_availability_response(UPPER_PINES_ID, start_date)


@app.get("/campgrounds/{campground_id}/availability", response_model=AvailabilityResponse)
def get_availability(
    campground_id: str,
    start_date: str = Query(default="2026-08-01", description="Start date (YYYY-MM-DD)"),
):
    return build_availability_response(campground_id, start_date)
