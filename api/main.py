from datetime import datetime

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


class ScanResult(BaseModel):
    campground_slug: str
    campground_name: str
    start_date: str
    sites_found: int
    available_sites: int
    success: bool
    error: str | None = None


class ScanResponse(BaseModel):
    total_scans: int
    successful_scans: int
    failed_scans: int
    results: list[ScanResult]


SEASON_START = 5
SEASON_END = 9


def get_camping_season_months(now: datetime | None = None) -> list[str]:
    if now is None:
        now = datetime.now()
    
    current_year = now.year
    current_month = now.month
    
    months = []
    for month in range(SEASON_START, SEASON_END + 1):
        if month >= current_month:
            months.append(f"{current_year}-{month:02d}-01")
    
    return months


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
        raw = fetch_campground_availability(campground["id"], start_date)
    except RecreationGovError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    return AvailabilityResponse(
        campground_id=campground["id"],
        campground_slug=slug,
        campground_name=campground["name"],
        start_date=start_date.split("T")[0],
        sites=[SiteResponse(**s.__dict__) for s in parse_sites(raw)],
    )


@app.post("/scan", response_model=ScanResponse)
def scan_all_campgrounds():
    months = get_camping_season_months()
    results = []
    
    for slug, campground in CAMPGROUNDS.items():
        for start_date in months:
            try:
                raw = fetch_campground_availability(campground["id"], start_date)
                sites = parse_sites(raw)
                available_sites = sum(1 for site in sites if site.has_availability)
                
                results.append(
                    ScanResult(
                        campground_slug=slug,
                        campground_name=campground["name"],
                        start_date=start_date,
                        sites_found=len(sites),
                        available_sites=available_sites,
                        success=True,
                    )
                )
            except RecreationGovError as e:
                results.append(
                    ScanResult(
                        campground_slug=slug,
                        campground_name=campground["name"],
                        start_date=start_date,
                        sites_found=0,
                        available_sites=0,
                        success=False,
                        error=str(e),
                    )
                )
    
    successful_scans = sum(1 for r in results if r.success)
    failed_scans = len(results) - successful_scans
    
    return ScanResponse(
        total_scans=len(results),
        successful_scans=successful_scans,
        failed_scans=failed_scans,
        results=results,
    )
