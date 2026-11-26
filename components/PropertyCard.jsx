import Image from 'next/image';
import Link from 'next/link';
import { FaBed, FaBath, FaMapMarkerAlt } from 'react-icons/fa';
import { rentalPrice } from '@/utils/ireland.mjs';
import { formatAvailability } from '@/utils/marketplace.mjs';
import BookmarkButton from './BookmarkButton';

export default function PropertyCard({ property, sample = false, saved = false, onSavedChange, list = false }) {
  const { _id, name, type, location, beds, baths, images, rates, availability, is_demo: demo } = property;
  const href = `/properties/${_id}${sample ? '?sample=1' : ''}`;
  return (
    <article className={'flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ' + (list ? 'sm:flex-row' : '')}>
      <Link href={href} className={'relative block aspect-[12/7] bg-emerald-50 ' + (list ? 'sm:w-1/3 sm:shrink-0' : '')}>
        <Image src={images?.[0] || '/rentals/apartment.svg'} alt={`View ${name}`} fill sizes='(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' className='object-cover' />
        {demo && <span className='absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800'>Sample listing</span>}
      </Link>
      <div className='flex flex-1 flex-col gap-3 p-5'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <p className='text-xs font-semibold uppercase tracking-wide text-slate-600'>{type}</p>
          <p className='font-bold text-brand-700'>{rentalPrice(rates)}</p>
        </div>
        <h3 className='break-words text-xl font-bold'><Link href={href}>{name}</Link></h3>
        <p className='flex items-center gap-2 text-sm text-slate-600'><FaMapMarkerAlt aria-hidden />{[location?.city, location?.county].filter(Boolean).join(', ')}</p>
        <div className='flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700'>
          <span className='flex items-center gap-2'><FaBed aria-hidden />{beds === 0 ? 'Studio' : `${beds} ${beds === 1 ? 'bed' : 'beds'}`}</span>
          <span className='flex items-center gap-2'><FaBath aria-hidden />{baths} {baths === 1 ? 'bath' : 'baths'}</span>
        </div>
        <p className='text-sm text-slate-700'>{availability ? `Available from ${formatAvailability(availability)}` : formatAvailability()}</p>
        <div className='mt-auto flex flex-wrap items-center gap-2 border-t pt-4'>
          <Link href={href} className='rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600'>View details</Link>
          {!sample && <BookmarkButton property={property} initiallySaved={saved} onSavedChange={onSavedChange} />}
        </div>
      </div>
    </article>
  );
}
