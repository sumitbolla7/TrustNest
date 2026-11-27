import { ArrowLeft, CalendarDays, MapPin, MessageCircle } from 'lucide-react';
import { searchReturn } from '@/utils/searchReturn.mjs';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { objectId } from '@/utils/security.mjs';
import { findRental, publicListing, listRentals } from '@/utils/catalogue';
import { rentalPrice, floorArea, formatRent } from '@/utils/ireland.mjs';
import { formatAvailability } from '@/utils/marketplace.mjs';
import BookmarkButton from '@/components/BookmarkButton';
import RentalActions from '@/components/RentalActions';
import CopyRentalLink from '@/components/CopyRentalLink';
import PropertyCard from '@/components/PropertyCard';
import { getSessionUser } from '@/utils/getSessionUser';
import Property from '@/models/Property';
import PropertyImages from '@/components/PropertyImages';
import RentalSafety from '@/components/RentalSafety';
import ShareButtons from '@/components/ShareButtons';
import PropertyMap from '@/components/MapPreview';

export async function generateMetadata({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const privatePage = query.preview === '1' || query.sample === '1';
  if (!objectId.test(id) || privatePage) return { title: 'Rental details | TrustNest', robots: { index: false, follow: false } };
  const listing = await findRental(id).catch(() => null);
  if (!listing) return { title: 'Rental unavailable | TrustNest', robots: { index: false, follow: false } };
  const title = listing.name + ' | TrustNest';
  const description = listing.description?.slice(0, 155) || 'Browse rental details on TrustNest.';
  return { title, description, alternates: { canonical: '/properties/' + id },
    robots: listing.is_demo ? { index: false, follow: false } : undefined,
    openGraph: { title, description, images: listing.images.slice(0, 1) } };
}

export default async function RentalDetailsPage({ params, searchParams }) {
  const { id } = await params;
  if (!objectId.test(id)) notFound();
  const query = await searchParams;
  const sample = query.sample === '1';
  const session = await getSessionUser();
  const preview = query.preview === '1' && session;
  let rental;
  try {
    if (preview) {
      const own = await Property.findOne({ _id: id, ...(session.user.role === 'admin' ? {} : { owner: session.userId }) }).lean();
      if (own) rental = { ...publicListing(own), status: own.status ?? 'active' };
    } else rental = await findRental(id, { sample });
  } catch {
    return <p role='alert' className='mx-auto max-w-6xl p-8'>This rental is temporarily unavailable. Try again shortly.</p>;
  }
  if (!rental) notFound();
  const { name, location, type, rates, beds, baths, furnishing, availability, amenities, description, is_demo: demo } = rental;
  const related = !preview && location.county ? (await listRentals({ county: location.county, page: 1, pageSize: 4, sort: 'newest' }, { sample, includeTotal: false }).catch(() => ({ properties: [] }))).properties.filter(item => item._id !== id).slice(0, 3) : [];
  const area = floorArea(rental);
  const images = rental.images.length ? rental.images : ['/rentals/apartment.svg'];
  return (
    <section className='mx-auto max-w-6xl px-4 py-8 sm:px-8'>
      <Link href={searchReturn(query.from, sample ? '/properties/demo' : '/properties')} className='inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline'><ArrowLeft size={16} /> Back to rentals</Link>
      {!demo && !preview && <div className='mt-4 flex flex-wrap gap-2 lg:hidden'><a href='#rental-actions' className='tn-button tn-primary'><MessageCircle size={16} /> Contact and viewing</a><a href='#availability' className='tn-button tn-secondary'><CalendarDays size={16} /> Availability</a></div>}
      <div className='mt-5 grid gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <div className='min-w-0 space-y-6'>
          <header>
            {preview && <p className='mb-2 font-semibold text-brand-700'>Private preview · {rental.status}</p>}
            {demo && <p className='mb-2 font-semibold text-brand-700'>Fictional sample listing</p>}
            <h1 className='break-words text-3xl font-bold text-brand-800 sm:text-4xl'>{name}</h1>
            <p className='mt-2 text-slate-600'>{[location.city, location.county].filter(Boolean).join(', ')} · Approximate location</p>
          </header>
          <PropertyImages images={images} />
          <section className='rounded-2xl border bg-white p-6'>
            <h2 className='text-xl font-bold'>About this rental</h2>
            <p className='my-3 break-words whitespace-pre-line text-slate-700'>{description || 'Ask the landlord for more information.'}</p>
            <dl className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {Object.entries({ Type: type, Bedrooms: beds, Bathrooms: baths, Furnishing: furnishing, BER: rental.ber || null, 'Floor area': Number.isFinite(area) ? `${area} m²` : null }).filter(([, value]) => value != null).map(([key, value]) => (
                <div key={key}><dt className='text-sm text-slate-600'>{key}</dt><dd className='font-semibold'>{value}</dd></div>
              ))}
            </dl>
            {rental.conditions && <p className='mt-3 whitespace-pre-line break-words'><strong>Rental conditions</strong><br />{rental.conditions}</p>}
            {amenities?.length > 0 && <>
              <h2 className='mb-3 mt-6 text-xl font-bold'>Amenities</h2>
              <ul className='flex flex-wrap gap-2'>{amenities.map((name, index) => <li key={index} className='rounded-lg bg-emerald-50 px-3 py-1 text-sm'>{name}</li>)}</ul>
            </>}
          </section>
          {!demo && <section className='tn-panel p-5'><h2 className='flex items-center gap-2 text-xl font-bold'><MapPin size={20} /> Approximate location</h2><p className='mt-2 text-slate-600'>{[location.city, location.county, 'Ireland'].filter(Boolean).join(', ')}</p>{process.env.NEXT_PUBLIC_MAPBOX_TOKEN && process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY && <PropertyMap property={rental} />}</section>}
          <RentalSafety />
        </div>
        <aside className='min-w-0 space-y-5'>
          <section className='rounded-2xl border bg-white p-6'>
            <p className='text-2xl font-bold text-brand-700'>{rentalPrice(rates)}</p>
            <p id='availability' className='my-3 text-slate-700'>{availability ? `Available from ${formatAvailability(availability)}` : formatAvailability()}</p>
            {rental.deposit != null && <p className='mb-3'>Deposit {formatRent(rental.deposit)}</p>}
            {rental.landlord && <p className='mb-3'>Landlord: {rental.landlord.name}{rental.landlord.verified ? ' · TrustNest reviewed' : ' · Verification not approved'}</p>}
            {rental.landlord?.verified && <p className='mb-3 text-sm'>Platform review only. It is not government certification or a guarantee.</p>}
            {!sample && !preview && <><BookmarkButton property={rental} /><CopyRentalLink /></>}
            {demo && <p className='mt-4 text-sm text-slate-700'>This sample cannot receive enquiries.</p>}
          </section>
          {!demo && !preview && <>
            <RentalActions id={id} role={session?.user.role} />
            {process.env.NEXT_PUBLIC_DOMAIN && <ShareButtons property={rental} />}
          </>}
        </aside>
      </div>
      {!!related.length && <section className='mt-10'><h2 className='mb-4 text-2xl font-bold'>Related rentals</h2><div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>{related.map(property => <PropertyCard key={property._id} property={property} sample={sample} />)}</div></section>}
    </section>
  );
}
