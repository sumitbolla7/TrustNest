'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function PropertyImages({ images }) {
  const dialog = useRef(null);
  const [selected, setSelected] = useState(null);

  function move(step) {
    setSelected(index => (index + step + images.length) % images.length);
  }

  return <>
    <div className='grid grid-cols-2 gap-3'>
      {images.map((image, index) => (
        <button key={image + index} type='button' onClick={() => { setSelected(index); dialog.current?.showModal(); }}
          aria-label={`Open rental image ${index + 1}`}
          className={'relative overflow-hidden rounded-xl bg-emerald-50 ' + (index === 0 ? 'col-span-2 aspect-[5/3]' : 'aspect-[5/3]')}>
          <Image src={image} alt='' fill sizes={index === 0 ? '(min-width: 1024px) 62vw, 100vw' : '(min-width: 1024px) 31vw, 50vw'} className='object-cover' />
        </button>
      ))}
    </div>
    <dialog ref={dialog} aria-label='Rental photo gallery' onClose={() => setSelected(null)}
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
        <div className='relative min-h-0 grow'>
          <Image src={images[selected]} alt={'Rental photo ' + (selected + 1)} fill sizes='100vw' className='object-contain' />
        </div>
        {images.length > 1 && <div className='flex justify-center gap-4'>
          <button type='button' aria-label='Previous photo' className='tn-icon' onClick={() => move(-1)}><ChevronLeft size={21} /></button>
          <button type='button' aria-label='Next photo' className='tn-icon' onClick={() => move(1)}><ChevronRight size={21} /></button>
        </div>}
      </div>}
    </dialog>
  </>;
}
