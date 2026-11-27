'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import PropertyImage from './PropertyImage';
import PhotoCredit from './PhotoCredit';

export default function PropertyImages({ images, credits = [], illustrative = false }) {
  const dialog = useRef(null);
  const start = useRef(null);
  const [selected, setSelected] = useState(null);

  function show(index) {
    setSelected(index);
    dialog.current?.showModal();
  }
  function move(step) {
    setSelected(index => (index + step + images.length) % images.length);
  }
  function endSwipe(event) {
    if (start.current === null) return;
    const offset = (event.changedTouches[0]?.clientX ?? start.current) - start.current;
    start.current = null;
    if (images.length > 1 && Math.abs(offset) >= 48) move(offset > 0 ? -1 : 1);
  }

  return <>
    <div>
      <button type='button' onClick={() => show(0)} aria-label='Open rental image 1' className='relative block aspect-[5/3] w-full overflow-hidden rounded-xl bg-emerald-50'>
        <PropertyImage src={images[0]} alt={credits[0]?.alt ?? ''} fill sizes='(min-width: 1024px) 62vw, 100vw' className='object-cover' />
        <span className='absolute bottom-3 right-3 rounded-full bg-slate-950/85 px-3 py-1.5 text-sm font-semibold text-white'>{images.length} {images.length === 1 ? 'photo' : 'photos'}</span>
      </button>
      {images.length > 1 && <ul aria-label='Rental photo thumbnails' className='mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4'>
        {images.slice(1).map((image, index) => <li key={image + index}>
          <button type='button' onClick={() => show(index + 1)} aria-label={'Open rental image ' + (index + 2)} className='relative block aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-emerald-50'>
            <PropertyImage src={image} alt={credits[index + 1]?.alt ?? ''} fill sizes='(min-width: 1024px) 16vw, 30vw' className='object-cover' />
          </button>
        </li>)}
      </ul>}
      {illustrative && <p className='mt-3 text-sm text-slate-600'>Illustrative photos. The exterior and rooms show separate examples. <PhotoCredit photo={credits[0]} /></p>}
    </div>
    <dialog ref={dialog} aria-label='Rental photo gallery' onClose={() => { setSelected(null); start.current = null; }}
      onKeyDown={event => {
        if (images.length < 2) return;
        if (event.key === 'ArrowLeft') move(-1);
        if (event.key === 'ArrowRight') move(1);
      }}
      className='fixed inset-0 m-0 h-dvh max-h-dvh w-screen max-w-none bg-slate-950 p-4 text-white sm:p-6'>
      {selected !== null && <div className='mx-auto flex h-full max-w-7xl flex-col gap-3'>
        <header className='flex items-center justify-between'>
          <p aria-live='polite'>Photo {selected + 1} of {images.length}</p>
          <button type='button' aria-label='Close gallery' className='tn-icon' onClick={() => dialog.current?.close()}><X size={20} /></button>
        </header>
        <div className='relative min-h-0 grow touch-pan-y' onTouchStart={event => { start.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={endSwipe}>
          <PropertyImage src={images[selected]} alt={credits[selected]?.alt ?? 'Rental photo ' + (selected + 1)} fill sizes='100vw' className='object-contain' />
        </div>
        {credits[selected] && <p className='text-center text-sm text-slate-200'><PhotoCredit photo={credits[selected]} /></p>}
        {images.length > 1 && <div className='flex justify-center gap-4'>
          <button type='button' aria-label='Previous photo' className='tn-icon' onClick={() => move(-1)}><ChevronLeft size={21} /></button>
          <button type='button' aria-label='Next photo' className='tn-icon' onClick={() => move(1)}><ChevronRight size={21} /></button>
        </div>}
      </div>}
    </dialog>
  </>;
}
