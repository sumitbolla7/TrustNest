import listings from '@/properties.json';
import { rentalPrice } from '@/utils/ireland.mjs';

export const metadata = { title: 'Sample rentals | TrustNest' };

export default function SampleRentals() {
  return (
    <section className='mx-auto max-w-5xl px-6 py-14'>
      <h1 className='text-4xl font-bold text-brand-700'>Sample rentals</h1>
      <p className='my-4'>These fictional listings show how Irish rents and locations appear in TrustNest.</p>
      <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {listings.map(listing => (
          <li key={listing.name} className='rounded-xl border border-emerald-100 bg-white p-5'>
            <h2 className='font-semibold'>{listing.name}</h2>
            <p>{rentalPrice(listing.rates)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
