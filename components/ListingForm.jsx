'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { counties, furnishings, marketplaceAmenities } from '@/utils/marketplace.mjs';
import { rentalTypes, floorArea } from '@/utils/ireland.mjs';

const input = 'mt-1 block w-full rounded-lg border border-slate-300 p-2';

export default function ListingForm({ rental = null }) {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const photos = rental?.images ?? [];

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    let active = true;
    queueMicrotask(() => { if (active) setPreviews(urls); });
    return () => { active = false; urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [files]);

  const field = (label, name, value, props = {}) => (
    <label>{label}<input name={name} defaultValue={value ?? ''} className={input} {...props} /></label>
  );
  const select = (label, name, value, options, required = false) => (
    <label>{label}<select name={name} className={input} defaultValue={value ?? ''} required={required}>
      <option value=''>Choose {label.toLowerCase()}</option>{options.map(option => <option key={option}>{option}</option>)}
    </select></label>
  );

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set('intent', event.nativeEvent.submitter?.value ?? 'draft');
    files.forEach(file => data.append('images', file));
    removed.forEach(index => data.append('removeImage', String(index)));
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/properties' + (rental ? '/' + rental._id : ''), {
        method: rental ? 'PUT' : 'POST', headers: { Accept: 'application/json' }, body: data,
      });
      if (!response.ok) throw new Error(await response.text());
      const record = await response.json();
      router.push('/properties/' + record._id + '?preview=1&saved=' + (data.get('intent') === 'submit' ? 'pending' : 'draft'));
      router.refresh();
    } catch (error) {
      setError(error.message || 'The rental could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className='grid gap-5'>
      <fieldset className='grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2'>
        <legend className='px-2 text-lg font-bold'>Rental and location</legend>
        {field('Title','name',rental?.name,{ required:true,maxLength:120 })}
        {select('Property type','type',rental?.type,[...new Set([...rentalTypes, ...(rental?.type ? [rental.type] : [])])],true)}
        {select('County','location.county',rental?.location?.county ?? rental?.location?.state,counties,true)}
        {field('Town or city','location.city',rental?.location?.city,{required:true,maxLength:80})}
        {field('Private street address','location.street',rental?.location?.street,{maxLength:150})}
        {field('Private Eircode','location.eircode',rental?.location?.eircode,{maxLength:8})}
        <label className='sm:col-span-2'>Description<textarea name='description' className={input} defaultValue={rental?.description} maxLength={4000} /></label>
      </fieldset>
      <fieldset className='grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2'>
        <legend className='px-2 text-lg font-bold'>Rent and features</legend>
        {field('Monthly rent (€)','rates.monthly',rental?.rates?.monthly,{type:'number',min:1,max:100000,step:'0.01'})}
        {field('Deposit (€)','deposit',rental?.deposit,{type:'number',min:0,max:100000,step:'0.01'})}
        {field('Weekly rent (€)','rates.weekly',rental?.rates?.weekly,{type:'number',min:1,max:100000,step:'0.01'})}
        {field('Nightly rent (€)','rates.nightly',rental?.rates?.nightly,{type:'number',min:1,max:100000,step:'0.01'})}
        {field('Bedrooms','beds',rental?.beds,{required:true,type:'number',min:0,max:100})}
        {field('Bathrooms','baths',rental?.baths,{required:true,type:'number',min:0,max:100})}
        {field('Floor area (m²)','square_metres',rental && (floorArea(rental) || ''),{required:true,type:'number',min:1,max:100000,step:'0.01'})}
        {field('Available from','availability',rental?.availability,{type:'date'})}
        {select('Furnishing','furnishing',rental?.furnishing,furnishings)}
        {select('BER','ber',rental?.ber,['A1','A2','A3','B1','B2','B3','C1','C2','C3','D1','D2','E1','E2','F','G','Exempt'])}
        <label className='sm:col-span-2'>Rental conditions<textarea name='conditions' className={input} defaultValue={rental?.conditions} maxLength={1500} /></label>
        <fieldset className='flex flex-wrap gap-3 sm:col-span-2'><legend className='mb-2 font-semibold'>Amenities</legend>
          {[...new Set([...marketplaceAmenities, ...(rental?.amenities ?? [])])].map(option => <label key={option}><input name='amenities' value={option} type='checkbox' defaultChecked={rental?.amenities?.includes(option)} /> {option}</label>)}
        </fieldset>
      </fieldset>
      <fieldset className='rounded-xl border bg-white p-5'>
        <legend className='px-2 text-lg font-bold'>Photos</legend>
        <label>Add JPEG or PNG photos (up to four in total, 1 MB each)<input type='file' className={input} accept='image/png,image/jpeg' multiple onChange={event => {
          const selected = Array.from(event.target.files);
          const accepted = selected.every(file => ['image/png','image/jpeg'].includes(file.type) && file.size <= 1024 * 1024);
          if (!accepted || selected.length + files.length + photos.length - removed.length > 4) setError('Use up to four JPEG or PNG photos of 1 MB each.');
          else { setFiles([...files, ...selected]); setError(''); }
          event.target.value = '';
        }} /></label>
        <ul className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {photos.map((url, index) => !removed.includes(index) && <li key={url}><Image src={url} alt='Listing photo' width={200} height={120} className='aspect-video w-full rounded object-cover' /><button type='button' className='text-sm underline' onClick={() => setRemoved([...removed,index])}>Remove photo {index + 1}</button></li>)}
          {previews.map((url, index) => <li key={url}><Image src={url} alt='Selected photo preview' width={200} height={120} unoptimized className='aspect-video w-full rounded object-cover' /><button type='button' className='text-sm underline' onClick={() => setFiles(files.filter((_, i) => i !== index))}>Remove selected photo {index + 1}</button></li>)}
        </ul>
      </fieldset>
      {error && <p role='alert' className='rounded border border-red-300 bg-red-50 p-3'>{error}</p>}
      <div className='flex flex-wrap gap-3'>
        <button disabled={busy} value='draft' className='rounded border px-4 py-2'>{busy ? 'Saving…' : 'Save draft'}</button>
        <button disabled={busy} value='submit' className='rounded bg-brand-700 px-4 py-2 text-white'>{busy ? 'Saving…' : 'Submit for approval'}</button>
      </div>
    </form>
  );
}
