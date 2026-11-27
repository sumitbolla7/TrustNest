'use client';

import { useRef } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

export default function FilterDrawer({ children }) {
  const drawer = useRef(null);
  return <div className='lg:hidden'>
    <button type='button' className='tn-button tn-secondary w-full sm:w-auto' onClick={() => drawer.current?.showModal()}><SlidersHorizontal size={17} /> Filters</button>
    <dialog ref={drawer} aria-labelledby='filter-drawer-title' className='fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-sm overflow-y-auto border-l border-slate-200 bg-white p-4 sm:p-5'>
      <header className='mb-4 flex items-center justify-between gap-3'>
        <h2 id='filter-drawer-title' className='text-xl font-bold'>Rental filters</h2>
        <button type='button' aria-label='Close filters' className='tn-icon' onClick={() => drawer.current?.close()}><X size={21} /></button>
      </header>
      {children}
    </dialog>
  </div>;
}
