import Link from 'next/link';
import RentalFilters from '@/components/RentalFilters';
import PropertyCard from '@/components/PropertyCard';
import { listRentals } from '@/utils/catalogue';
import { listingFilters } from '@/utils/marketplace.mjs';

export default async function RentalCatalogue({ searchParams, sample = false }) {
  const values = await searchParams;
  const action = sample ? '/properties/demo' : '/properties';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values ?? {})) {
    for (const entry of Array.isArray(value) ? value : [value]) params.append(key, entry);
  }

  let results;
  let filters;
  let message;
  try {
    filters = listingFilters(params);
  } catch {
    message = 'Some filters are invalid. Clear them or update your search.';
  }
  if (filters) {
    try {
      results = await listRentals(filters, { sample });
    } catch {
      message = 'Rentals are temporarily unavailable. Try again shortly.';
    }
  }
  const linkFor = page => {
    const next = new URLSearchParams(params);
    next.set('page', page);
    return `${action}?${next.toString()}`;
  };

  return (
    <section className='mx-auto max-w-7xl px-4 py-10 sm:px-8'>
      <h1 className='text-4xl font-bold tracking-tight text-brand-800'>{sample ? 'Sample rentals' : 'Find a home'}</h1>
      <p className='mt-2 mb-6 text-slate-600'>{sample || !process.env.MONGODB_URI ? 'Fictional sample rentals for exploring TrustNest.' : 'Browse rentals across the 26 counties in the Republic of Ireland.'}</p>
      <RentalFilters values={values} action={action} />
      {message ? <p role='alert' className='mt-8 rounded-xl border bg-white p-6'>{message}</p> : (
        <>
          <h2 className='my-6 text-xl font-semibold'>{results.total} {results.total === 1 ? 'rental' : 'rentals'} found</h2>
          {results.properties.length ? (
            <div className={filters.view === 'list' ? 'grid max-w-4xl gap-4' : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'}>
              {results.properties.map(property => <PropertyCard key={property._id} property={property} sample={sample} list={filters.view === 'list'} />)}
            </div>
          ) : <p className='rounded-xl border bg-white p-6'>No rentals on this page. Try changing your filters or returning to the first page.</p>}
          {((filters.page > 1) || results.total > filters.pageSize) && (
            <nav aria-label='Rental pages' className='mt-8 flex flex-wrap items-center gap-4'>
              {filters.page > 1 && <Link href={linkFor(filters.page - 1)} className='rounded-lg border px-4 py-2'>Previous</Link>}
              <span>Page {filters.page} of {Math.max(1, Math.min(200, Math.ceil(results.total / filters.pageSize)))}</span>
              {filters.page < 200 && filters.page * filters.pageSize < results.total && <Link href={linkFor(filters.page + 1)} className='rounded-lg border px-4 py-2'>Next</Link>}
            </nav>
          )}
        </>
      )}
    </section>
  );
}
