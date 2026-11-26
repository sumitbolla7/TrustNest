import Link from 'next/link';
import { rentalTypes } from '@/utils/ireland.mjs';
import { counties, furnishings, marketplaceAmenities, sorts } from '@/utils/marketplace.mjs';

const control = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900';

export default function RentalFilters({ values = {}, compact = false, action = '/properties' }) {
  const field = (name, label, options) => (
    <label className='text-sm font-semibold'>
      {label}
      <select aria-label={label} name={name} defaultValue={values[name] ?? ''} className={control}>
        <option value=''>Any</option>
        {options.map(item => <option key={item}>{item}</option>)}
      </select>
    </label>
  );
  const number = (name, label, max, step = 1) => (
    <label className='text-sm font-semibold'>
      {label}
      <input name={name} type='number' min='0' max={max} step={step} defaultValue={values[name]} className={control} />
    </label>
  );
  return (
    <form action={action} method='get' className='rounded-2xl border border-emerald-100 bg-white p-4 text-slate-900 shadow-sm sm:p-6' aria-label='Rental search'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {field('county', 'County', counties)}
        <label className='text-sm font-semibold'>
          Town or city
          <input name='town' maxLength={80} placeholder='e.g. Galway' defaultValue={values.town} className={control} />
        </label>
        {compact ? (
          <>
            {field('propertyType', 'Property type', rentalTypes)}
            {number('minRent', 'Min monthly rent (€)', 100000, 0.01)}
            {number('maxRent', 'Max monthly rent (€)', 100000, 0.01)}
            <button className='self-end rounded-lg bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-600'>Find rentals</button>
          </>
        ) : (
          <>
            {number('minRent', 'Min monthly rent (€)', 100000, 0.01)}
            {number('maxRent', 'Max monthly rent (€)', 100000, 0.01)}
            {field('propertyType', 'Property type', rentalTypes)}
            {number('beds', 'Bedrooms', 100)}
            {number('baths', 'Bathrooms', 100)}
            {field('furnishing', 'Furnishing', furnishings)}
            <label className='text-sm font-semibold'>
              Available by
              <input name='availableBy' type='date' defaultValue={values.availableBy} className={control} />
            </label>
            <label className='text-sm font-semibold'>
              Sort by
              <select aria-label='Sort by' name='sort' defaultValue={values.sort ?? 'newest'} className={control}>
                {Object.entries(sorts).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className='text-sm font-semibold sm:col-span-2'>
              Search terms
              <input name='location' maxLength={100} defaultValue={values.location} placeholder='Listing title, town or county' className={control} />
            </label>
          </>
        )}
      </div>
      {!compact && (
        <>
          <div className='mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm'>
            <label><input type='checkbox' name='verified' value='1' defaultChecked={values.verified === '1'} className='mr-2 accent-brand-700' />TrustNest-reviewed landlords</label>
            <label>View <select name='view' className='rounded border px-2' defaultValue={values.view ?? 'grid'}><option value='grid'>Grid</option><option value='list'>List</option></select></label>
            <label><input type='checkbox' name='shared' value='1' defaultChecked={values.shared === '1'} className='mr-2 accent-brand-700' />Shared accommodation</label>
            <label><input type='checkbox' name='student' value='1' defaultChecked={values.student === '1'} className='mr-2 accent-brand-700' />Student accommodation</label>
          </div>
          <fieldset className='mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm'>
            <legend className='mb-2 font-semibold'>Amenities</legend>
            {marketplaceAmenities.map(amenity => (
              <label key={amenity}><input type='checkbox' name='amenity' value={amenity} defaultChecked={values.amenity?.includes(amenity)} className='mr-2 accent-brand-700' />{amenity}</label>
            ))}
          </fieldset>
          <div className='mt-5 flex flex-wrap items-center gap-4'>
            <button className='rounded-lg bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-600'>Apply filters</button>
            <Link href={action} className='font-semibold text-brand-700 underline'>Clear filters</Link>
          </div>
        </>
      )}
    </form>
  );
}
