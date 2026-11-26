import Link from 'next/link';
import Hero from '@/components/Hero';
import PropertyCard from '@/components/PropertyCard';
import RentalSafety from '@/components/RentalSafety';
import { listRentals } from '@/utils/catalogue';

export const dynamic = 'force-dynamic';

async function RentalSection({ featured, title }) {
  let rentals;
  try {
    rentals = (await listRentals({ page: 1, pageSize: 3, sort: 'newest' }, { featured })).properties;
  } catch {
    return <p className='rounded-xl border bg-white p-5' role='status'>{title} are temporarily unavailable.</p>;
  }
  return (
    <section>
      <div className='mb-5 flex flex-wrap items-baseline justify-between gap-3'>
        <h2 className='text-2xl font-bold tracking-tight text-brand-800 sm:text-3xl'>{title}</h2>
        <Link href='/properties' className='font-semibold text-brand-700 underline'>Browse rentals</Link>
      </div>
      {rentals.length ? (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {rentals.map(property => <PropertyCard key={property._id} property={property} />)}
        </div>
      ) : <p className='rounded-xl border bg-white p-5'>No rentals are available in this section yet.</p>}
    </section>
  );
}

const categories = [['Apartment', 'Apartments'], ['House', 'Houses'], ['Studio', 'Studios'], ['Shared Accommodation', 'Shared accommodation']];

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className='mx-auto grid max-w-7xl gap-12 px-4 py-10 sm:px-8 sm:py-14'>
        <section>
          <h2 className='mb-4 text-2xl font-bold text-brand-800'>Explore by rental type</h2>
          <div className='flex flex-wrap gap-3'>
            {categories.map(([value, label]) => (
              <Link key={value} href={`/properties?propertyType=${encodeURIComponent(value)}`}
                className='rounded-full border border-emerald-200 bg-white px-4 py-2 font-semibold text-brand-700 hover:bg-emerald-50'>{label}</Link>
            ))}
          </div>
        </section>
        <RentalSection featured title='Featured rentals' />
        <RentalSection title='Recently added rentals' />
        <div className='grid gap-6 lg:grid-cols-2'>
          <RentalSafety />
          <section className='rounded-2xl border border-emerald-100 bg-white p-6'>
            <h2 className='text-2xl font-bold text-brand-800'>Student accommodation</h2>
            <p className='my-4 text-slate-700'>Compare student rentals by county, monthly budget and move-in date.</p>
            <Link href='/properties?student=1' className='inline-block rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white'>Find student rentals</Link>
          </section>
        </div>
      </div>
    </>
  );
}
