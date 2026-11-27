import Link from 'next/link';
import { photos, photoModifications } from '@/config/photoLibrary.mjs';

export const metadata = { title: 'Photo credits | TrustNest', description: 'Sources and licences for the photos in the TrustNest Irish rental demonstration.' };

export default function PhotoCredits() {
  return <section className='mx-auto max-w-5xl px-4 py-10 sm:px-8'>
    <h1 className='text-4xl font-bold'>Photo credits</h1>
    <p className='my-4 max-w-3xl text-slate-600'>These photos illustrate housing and interiors. They do not advertise the photographed properties. Exterior and interior photographs may show different places.</p>
    <p className='mb-5 text-slate-600'>{photoModifications} Share-alike versions retain the original licence.</p>
    <ul className='grid gap-4 sm:grid-cols-2'>
      {photos.map(photo => <li key={photo.path} id={photo.path.split('/').pop().replace(/\.webp$/, '')} className='tn-panel scroll-mt-4 break-words p-4'>
        <p className='font-semibold'>{photo.title}</p>
        <p className='my-1 text-sm text-slate-700'>{photo.creator}</p>
        <div className='flex flex-wrap gap-3 text-sm font-semibold text-brand-700 underline'>
          <a href={photo.source}>Original source</a><a href={photo.licenseUrl}>{photo.license}</a><Link href={photo.path}>Local WebP</Link>
        </div>
      </li>)}
    </ul>
  </section>;
}
