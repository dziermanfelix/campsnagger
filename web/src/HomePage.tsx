import { useEffect, useState } from 'react';

import {
  getCampgroundAvailability,
  getCampgrounds,
  type AvailabilityResponse,
  type Campground,
  type Site,
} from './api/client';
import Spinner from './components/Spinner';
import { defaultCampingMonth, formatAvailableDays, formatMonthLabel, getCampingMonths } from './util/months';

const campingMonths = getCampingMonths();
const rowGrid =
  'grid grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem] gap-3 border-b border-stone-800/60 px-3 py-2 text-sm last:border-b-0 sm:grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem_1fr]';
const REC_GOV_LOGIN = 'https://www.recreation.gov/log-in';

export default function HomePage() {
  const [campgrounds, setCampgrounds] = useState<Campground[]>([]);
  const [campgroundSlug, setCampgroundSlug] = useState('upper-pines');
  const [startDate, setStartDate] = useState(defaultCampingMonth);
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAvailability(slug = campgroundSlug, date = startDate) {
    setLoading(true);
    setError(null);
    try {
      setData(await getCampgroundAvailability(slug, date));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getCampgrounds()
      .then(setCampgrounds)
      .catch(() => setError('Failed to load campgrounds'));
    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = campgrounds.find((c) => c.slug === campgroundSlug);
  const available = data?.sites.filter((s) => s.has_availability) ?? [];

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-stone-950 text-stone-100'>
      <div className='mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-4 py-6'>
        <header className='mb-6 shrink-0'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-sm font-medium uppercase tracking-widest text-emerald-400'>Campsnagger</p>
            <div className='flex items-center gap-3'>
              <p className='max-w-56 text-right text-xs text-stone-500 sm:max-w-none'>
                Log in to Recreation.gov for faster checkout
              </p>
              <a
                href={REC_GOV_LOGIN}
                target='_blank'
                rel='noopener noreferrer'
                className='shrink-0 rounded-lg border border-stone-600 px-3 py-1.5 text-sm font-medium text-stone-200 transition hover:border-stone-400 hover:text-white'
              >
                Log in
              </a>
            </div>
          </div>
          <h1 className='mt-2 text-4xl font-semibold tracking-tight text-white'>
            {data?.campground_name ?? selected?.name ?? 'Campground'} availability
          </h1>
          <p className='mt-3 max-w-xl text-stone-400'>Check Yosemite openings, then open a site in this browser.</p>
        </header>

        {error && (
          <p className='mb-4 shrink-0 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-red-300'>
            {error}
          </p>
        )}

        <div className='flex shrink-0 flex-wrap items-end gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-4'>
          <label className='flex flex-col gap-1 text-sm text-stone-400'>
            Campground
            <select
              value={campgroundSlug}
              onChange={(e) => {
                const slug = e.target.value;
                setCampgroundSlug(slug);
                fetchAvailability(slug, startDate);
              }}
              className='rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-stone-100'
            >
              {campgrounds.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className='flex flex-col gap-1 text-sm text-stone-400'>
            Month
            <select
              value={startDate}
              onChange={(e) => {
                const date = e.target.value;
                setStartDate(date);
                fetchAvailability(campgroundSlug, date);
              }}
              className='rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-stone-100'
            >
              {campingMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className='mt-6 flex min-h-0 flex-1 items-center justify-center'>
            <Spinner />
          </div>
        ) : (
          data && (
            <section className='mt-6 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden'>
              <SiteList
                title='Summary'
                subtitle={`${available.length} of ${data.sites.length} sites available · ${formatMonthLabel(data.start_date)}`}
                sites={available}
                empty='No openings found for this month.'
                summary
              />
              <SiteList title={`All sites (${data.sites.length})`} sites={data.sites} />
            </section>
          )
        )}
      </div>
    </div>
  );
}

function SiteList({
  title,
  subtitle,
  sites,
  empty,
  summary = false,
}: {
  title: string;
  subtitle?: string;
  sites: Site[];
  empty?: string;
  summary?: boolean;
}) {
  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      <h2 className='mb-3 shrink-0 text-sm font-medium uppercase tracking-widest text-stone-400'>{title}</h2>
      <div
        className={
          summary
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-900/60'
            : 'min-h-0 flex-1 overflow-y-auto rounded-xl border border-stone-800 bg-stone-900/40'
        }
      >
        {subtitle && (
          <div className='shrink-0 border-b border-stone-800 px-4 py-3'>
            <p className='text-sm text-stone-300'>{subtitle}</p>
          </div>
        )}
        {summary ? (
          <div className='min-h-0 flex-1 overflow-y-auto px-4 py-3'>
            {sites.length === 0 ? (
              <p className='text-sm text-stone-500'>{empty}</p>
            ) : (
              <ul className='space-y-2'>
                {sites.map((site) => (
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
                    <span className='text-stone-400'>{formatAvailableDays(site.available_dates)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <div className='sticky top-0 z-10 grid grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem] gap-3 border-b border-stone-800 bg-stone-950/95 px-3 py-2 text-xs font-medium uppercase tracking-wide text-stone-500 backdrop-blur sm:grid-cols-[1.5rem_3.5rem_5rem_1fr_5.5rem_1fr]'>
              <span aria-hidden />
              <span>Site</span>
              <span>Loop</span>
              <span>Type</span>
              <span>Status</span>
              <span className='hidden sm:block'>Dates</span>
            </div>
            <ul>
              {sites.map((site) => (
                <li key={site.campsite_id} className={`${rowGrid} ${site.has_availability ? 'bg-emerald-950/10' : ''}`}>
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
                      site.has_availability ? 'hidden text-stone-400 sm:block' : 'hidden text-stone-600 sm:block'
                    }
                  >
                    {site.has_availability ? formatAvailableDays(site.available_dates) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
