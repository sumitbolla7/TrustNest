import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Plus } from 'lucide-react';
import RentalFilters from './RentalFilters';

export default function Hero() {
  return (
    <section className='relative bg-slate-900 text-white'>
      <div className='mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-8 sm:pt-16'>
        <div className='grid min-w-0 items-center gap-9 lg:grid-cols-[1.18fr_0.82fr]'>
          <div>
            <p className='mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-sm text-emerald-200'><MapPin size={15} /> Rentals across Ireland</p>
            <h1 className='max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl'>Find your next home in Ireland</h1>
            <p className='mt-5 max-w-xl text-lg leading-relaxed text-slate-300'>Search apartments, houses and rooms by county, budget and move-in date.</p>
            <div className='mt-7 flex flex-wrap gap-4'>
              <Link href='/properties/add' className='tn-button bg-emerald-300 text-slate-950 hover:bg-emerald-200'><Plus size={18} /> List a property</Link>
              <Link href='/properties/demo' className='tn-button border border-white/25 text-white hover:bg-white/10'>Sample rentals <ArrowRight size={16} /></Link>
            </div>
          </div>
          <div className='relative hidden aspect-[12/7] overflow-hidden rounded-3xl bg-emerald-900 lg:block'>
            <Image src='/rentals/house.svg' alt='Illustration of a house with a pitched roof and garden' fill sizes='(min-width: 1024px) 38vw, 0px' preload className='object-cover' />
          </div>
        </div>
        <div className='mt-9'><RentalFilters compact /></div>
      </div>
    </section>
  );
}
