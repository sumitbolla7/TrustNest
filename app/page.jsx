import { photoByPath } from '@/config/photoLibrary.mjs';
import PropertyImage from '@/components/PropertyImage';
import PhotoCredit from '@/components/PhotoCredit';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Hero from '@/components/Hero';
import PropertyCard from '@/components/PropertyCard';
import RentalSafety from '@/components/RentalSafety';
import { listRentals } from '@/utils/catalogue';

export const dynamic = 'force-dynamic';

async function RentalSection({ featured, verified, title }) {
  let rentals;
  try {
    rentals = (await listRentals({ page: 1, pageSize: 3, sort: 'newest', verified }, { featured, includeTotal: false })).properties;
  } catch {
    return <p className='rounded-xl border bg-white p-5' role='status'>{title} are temporarily unavailable.</p>;
  }
  return (
    <section>
      <div className='mb-5 flex flex-wrap items-baseline justify-between gap-3'>
        <h2 className='text-2xl font-bold tracking-tight text-brand-800 sm:text-3xl'>{title}</h2>
        <Link href={verified ? '/properties?verified=1' : '/properties'} className='font-semibold text-brand-700 underline'>Browse rentals</Link>
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
        <section>
          <h2 className='mb-4 text-2xl font-bold text-brand-800'>Popular Irish locations</h2>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>{['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'].map(county => {
            const photo = photoByPath.get('/images/locations/' + county.toLowerCase() + '.webp');
            return <figure key={county} className='tn-panel overflow-hidden'>
              <Link href={'/properties?county=' + county} className='block'>
                <span className='relative block aspect-[5/3] bg-emerald-50'><PropertyImage src={photo?.path} alt={photo?.alt ?? ''} fill sizes='(min-width: 1024px) 17vw, 50vw' className='object-cover' /></span>
                <span className='block px-3 pt-3 font-semibold text-brand-700'>{county}</span>
              </Link>
              <figcaption className='break-words px-3 pb-3 pt-1 text-xs text-slate-600'><PhotoCredit photo={photo} /></figcaption>
            </figure>;
          })}</div>
        </section>
        <RentalSection featured title='Featured rentals' />
        <RentalSection title='Recently added rentals' />
        <div className='grid gap-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-7'>
          <p className='flex items-center gap-2 text-sm font-semibold text-brand-700'><ShieldCheck size={18} /> Platform verification</p>
          <RentalSection verified title='Rentals from TrustNest-reviewed landlords' />
          <p className='text-sm text-slate-700'>A review confirms a TrustNest moderation decision. It carries no government endorsement or transaction guarantee.</p>
        </div>
        <div className='grid gap-6 lg:grid-cols-2'>
          <RentalSafety />
          <section className='rounded-2xl border border-emerald-100 bg-white p-6'>
            <h2 className='text-2xl font-bold text-brand-800'>Student accommodation</h2>
            <p className='my-4 text-slate-700'>Compare student rentals by county, monthly budget and move-in date.</p>
            <Link href='/properties?student=1' className='inline-block rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white'>Find student rentals</Link>
          </section>
        </div>
        <section className='grid gap-5 rounded-2xl bg-slate-900 p-6 text-white sm:grid-cols-2 sm:p-8'>
          <div><h2 className='text-2xl font-bold'>How TrustNest works</h2><p className='my-3 text-slate-200'>Compare Irish rentals, save your shortlist, then contact the landlord or request a viewing from the listing.</p><Link href='/info/guide' className='underline'>Read the rental guide</Link></div>
          <div className='flex flex-wrap items-center gap-3'><Link href='/account?mode=register&role=tenant' className='rounded bg-white px-4 py-2 font-semibold text-slate-900'>Register as a tenant</Link><Link href='/account?mode=register&role=landlord' className='rounded bg-brand-600 px-4 py-2 font-semibold text-white'>Register as a landlord</Link></div>
        </section>
        <section><h2 className='mb-3 text-2xl font-bold text-brand-800'>Frequently asked questions</h2>
          <details className='rounded border bg-white p-4'><summary className='cursor-pointer font-medium'>How do I arrange a viewing?</summary><p className='pt-2'>Sign in as a tenant and submit a preferred time from the rental page.</p></details>
          <details className='mt-2 rounded border bg-white p-4'><summary className='cursor-pointer font-medium'>Can I pay a deposit here?</summary><p className='pt-2'>TrustNest does not handle payments. View the rental and check the person’s authority to let it before paying.</p></details>
          <Link href='/info/faq' className='mt-3 inline-block font-semibold text-brand-700 underline'>More answers</Link>
        </section>
      </div>
    </>
  );
}
