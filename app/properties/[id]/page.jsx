import Link from 'next/link';
import { notFound } from 'next/navigation';
import { objectId } from '@/utils/security.mjs';
import { findRental } from '@/utils/catalogue';
import { rentalPrice, floorArea } from '@/utils/ireland.mjs';
import { formatAvailability } from '@/utils/marketplace.mjs';
import BookmarkButton from '@/components/BookmarkButton';
import PropertyContactForm from '@/components/PropertyContactForm';
import PropertyImages from '@/components/PropertyImages';
import RentalSafety from '@/components/RentalSafety';
import ShareButtons from '@/components/ShareButtons';
import PropertyMap from '@/components/PropertyMap';

export const metadata = { title: 'Rental details | TrustNest' };

export default async function RentalDetailsPage({ params, searchParams }) {
  const { id } = await params;
  if (!objectId.test(id)) notFound();
  const sample = (await searchParams).sample === '1';
  let rental;
  try {
    rental = await findRental(id, { sample });
  } catch {
    return <p role='alert' className='mx-auto max-w-6xl p-8'>This rental is temporarily unavailable. Try again shortly.</p>;
  }
  if (!rental) notFound();
  const { name, location, type, rates, beds, baths, furnishing, availability, amenities, description, is_demo: demo } = rental;
  const area = floorArea(rental);
  const images = rental.images.length ? rental.images : ['/rentals/apartment.svg'];
  return (
    <section className='mx-auto max-w-6xl px-4 py-8 sm:px-8'>
      <Link href={sample ? '/properties/demo' : '/properties'} className='text-sm font-semibold text-brand-700 underline'>Back to rentals</Link>
      <div className='mt-5 grid gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <div className='min-w-0 space-y-6'>
          <header>
            {demo && <p className='mb-2 font-semibold text-brand-700'>Fictional sample listing</p>}
            <h1 className='break-words text-3xl font-bold text-brand-800 sm:text-4xl'>{name}</h1>
            <p className='mt-2 text-slate-600'>{[location.city, location.county].filter(Boolean).join(', ')} · Approximate location</p>
          </header>
          <PropertyImages images={images} />
          <section className='rounded-2xl border bg-white p-6'>
            <h2 className='text-xl font-bold'>About this rental</h2>
            <p className='my-3 break-words whitespace-pre-line text-slate-700'>{description || 'Ask the landlord for more information.'}</p>
            <dl className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {Object.entries({ Type: type, Bedrooms: beds, Bathrooms: baths, Furnishing: furnishing, 'Floor area': Number.isFinite(area) ? `${area} m²` : null }).filter(([, value]) => value != null).map(([key, value]) => (
                <div key={key}><dt className='text-sm text-slate-600'>{key}</dt><dd className='font-semibold'>{value}</dd></div>
              ))}
            </dl>
            {amenities?.length > 0 && <>
              <h2 className='mb-3 mt-6 text-xl font-bold'>Amenities</h2>
              <ul className='flex flex-wrap gap-2'>{amenities.map((name, index) => <li key={index} className='rounded-lg bg-emerald-50 px-3 py-1 text-sm'>{name}</li>)}</ul>
            </>}
          </section>
          {!demo && <PropertyMap property={rental} />}
          <RentalSafety />
        </div>
        <aside className='space-y-5'>
          <section className='rounded-2xl border bg-white p-6'>
            <p className='text-2xl font-bold text-brand-700'>{rentalPrice(rates)}</p>
            <p className='my-3 text-slate-700'>{availability ? `Available from ${formatAvailability(availability)}` : formatAvailability()}</p>
            {!sample && <BookmarkButton property={rental} />}
            {demo && <p className='mt-4 text-sm text-slate-700'>This sample cannot receive enquiries.</p>}
          </section>
          {!demo && <>
            <PropertyContactForm property={rental} />
            {process.env.NEXT_PUBLIC_DOMAIN && <ShareButtons property={rental} />}
          </>}
        </aside>
      </div>
    </section>
  );
}
