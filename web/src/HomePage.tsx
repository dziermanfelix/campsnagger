import { useEffect, useState } from 'react';

import { getCampgroundAvailability, getCampgrounds, type AvailabilityResponse, type Campground } from './api/client';
import { defaultCampingMonth, formatMonthLabel, getCampingMonths } from './util/months';

const campingMonths = getCampingMonths();

export default function HomePage() {
  const [campgrounds, setCampgrounds] = useState<Campground[]>([]);
  const [campgroundSlug, setCampgroundSlug] = useState('upper-pines');
  const [startDate, setStartDate] = useState(defaultCampingMonth);
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCampgrounds()
      .then(setCampgrounds)
      .catch(() => setError('Failed to load campgrounds'));
  }, []);

  async function fetchAvailability() {
    setLoading(true);
    setError(null);

    try {
      setData(await getCampgroundAvailability(campgroundSlug, startDate));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const selectedCampground = campgrounds.find((c) => c.slug === campgroundSlug);
  const availableSites = data?.sites.filter((s) => s.has_availability) ?? [];
  const siteCount = data?.sites.length ?? 0;

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-stone-950 text-stone-100'>
      <div className='mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-4 py-6'>
        <header className='mb-6 shrink-0'>
          <p className='text-sm font-medium uppercase tracking-widest text-emerald-400'>Campsnagger</p>
          <h1 className='mt-2 text-4xl font-semibold tracking-tight text-white'>
            {data?.campground_name ?? selectedCampground?.name ?? 'Campground'} availability
          </h1>
          <p className='mt-3 max-w-xl text-stone-400'>Check Yosemite campsite openings via recreation.gov.</p>
        </header>

        <div className='flex shrink-0 flex-wrap items-end gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-4'>
          <label className='flex flex-col gap-1 text-sm text-stone-400'>
            Campground
            <select
              value={campgroundSlug}
              onChange={(e) => {
                setCampgroundSlug(e.target.value);
                setData(null);
              }}
              className='rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-stone-100'
            >
              {campgrounds.map((campground) => (
                <option key={campground.slug} value={campground.slug}>
                  {campground.name}
                </option>
              ))}
            </select>
          </label>
          <label className='flex flex-col gap-1 text-sm text-stone-400'>
            Month
            <select
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setData(null);
              }}
              className='rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-stone-100'
            >
              {campingMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type='button'
            onClick={fetchAvailability}
            disabled={loading || campgrounds.length === 0}
            className='rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {loading ? 'Checking…' : 'Check availability'}
          </button>
        </div>

        {error && (
          <p className='mt-4 shrink-0 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-red-300'>
            {error}
          </p>
        )}

        {data && (
          <section className='mt-6 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden'>
            <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
              <h2 className='mb-3 shrink-0 text-sm font-medium uppercase tracking-widest text-stone-400'>Summary</h2>
              <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-900/60'>
                <div className='shrink-0 border-b border-stone-800 px-4 py-3'>
                  <p className='text-2xl font-semibold text-white'>
                    {availableSites.length}{' '}
                    <span className='text-base font-normal text-stone-400'>of {siteCount} sites available</span>
                  </p>
                  <p className='mt-1 text-sm text-stone-400'>{formatMonthLabel(data.start_date)}</p>
                </div>
                <div className='min-h-0 flex-1 overflow-y-auto px-4 py-3'>
                  {availableSites.length === 0 ? (
                    <p className='text-sm text-stone-500'>No openings found for this month.</p>
                  ) : (
                    <ul className='space-y-2'>
                      {availableSites.map((site) => (
                        <li key={site.campsite_id} className='flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm'>
                          <span aria-hidden>🍻</span>
                          <a
                            href={site.site_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='font-medium text-emerald-300 hover:text-emerald-200 hover:underline'
                          >
                            Site #{site.site_number}
                          </a>
                          <span className='text-stone-500'>{site.loop}</span>
                          <span className='text-stone-400'>{site.available_dates.join(', ')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
              <h2 className='mb-3 shrink-0 text-sm font-medium uppercase tracking-widest text-stone-400'>
                All sites ({siteCount})
              </h2>
              <div className='min-h-0 flex-1 overflow-y-auto rounded-xl border border-stone-800 bg-stone-900/40'>
                <div className='sticky top-0 z-10 grid grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem] gap-3 border-b border-stone-800 bg-stone-950/95 px-3 py-2 text-xs font-medium uppercase tracking-wide text-stone-500 backdrop-blur sm:grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem_1fr]'>
                  <span aria-hidden />
                  <span>Site</span>
                  <span>Loop</span>
                  <span>Type</span>
                  <span>Status</span>
                  <span className='hidden sm:block'>Dates</span>
                </div>
                <ul>
                  {data.sites.map((site) => (
                    <li
                      key={site.campsite_id}
                      className={
                        site.has_availability
                          ? 'grid grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem] gap-3 border-b border-stone-800/60 px-3 py-2 text-sm last:border-b-0 sm:grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem_1fr] bg-emerald-950/10'
                          : 'grid grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem] gap-3 border-b border-stone-800/60 px-3 py-2 text-sm last:border-b-0 sm:grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem_1fr]'
                      }
                    >
                      <span aria-hidden className='leading-5'>
                        {site.has_availability ? '🍻' : '💩'}
                      </span>
                      <a
                        href={site.site_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-medium text-white hover:text-emerald-300 hover:underline'
                      >
                        #{site.site_number}
                      </a>
                      <span className='truncate text-stone-500'>{site.loop}</span>
                      <span className='truncate text-stone-400'>{site.campsite_type}</span>
                      <span
                        className={
                          site.has_availability
                            ? 'text-xs font-medium text-emerald-400'
                            : 'text-xs font-medium text-stone-500'
                        }
                      >
                        {site.has_availability ? 'Open' : 'Full'}
                      </span>
                      <span
                        className={
                          site.has_availability
                            ? 'hidden truncate text-stone-400 sm:block'
                            : 'hidden truncate text-stone-600 sm:block'
                        }
                      >
                        {site.has_availability ? site.available_dates.join(', ') : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
