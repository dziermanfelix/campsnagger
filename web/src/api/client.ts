export type Campground = {
  slug: string
  id: string
  name: string
}

export type Site = {
  campsite_id: string
  site_number: string
  loop: string
  campsite_type: string
  has_availability: boolean
  available_dates: string[]
  site_url: string
}

export type AvailabilityResponse = {
  campground_id: string
  campground_slug: string
  campground_name: string
  start_date: string
  sites: Site[]
}

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.detail ?? `Request failed (${res.status})`)
}

export async function getCampgrounds(): Promise<Campground[]> {
  const res = await fetch('/api/campgrounds')
  if (!res.ok) await parseError(res)
  return res.json()
}

export async function getCampgroundAvailability(
  slug: string,
  startDate: string,
): Promise<AvailabilityResponse> {
  const params = new URLSearchParams({ start_date: startDate })
  const res = await fetch(`/api/campgrounds/${slug}/availability?${params}`)
  if (!res.ok) await parseError(res)
  return res.json()
}
