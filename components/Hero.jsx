import Link from 'next/link';
import RentalFilters from './RentalFilters';

export default function Hero() {
  return (
    <section className='bg-gradient-to-br from-brand-800 to-brand-700 text-white'>
      <div className='mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20'>
        <h1 className='max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl'>Find your next home in Ireland</h1>
        <p className='mt-3 mb-7 text-lg text-brand-400 sm:text-xl'>Everything local. Built on trust.</p>
        <RentalFilters compact />
        <Link href='/properties/demo' className='mt-5 inline-block text-sm font-semibold underline'>Explore fictional sample rentals</Link>
      </div>
    </section>
  );
}
