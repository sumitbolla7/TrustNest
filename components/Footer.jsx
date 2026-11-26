import Image from 'next/image';
import Link from 'next/link';

const links = [
  ['/properties', 'Find a home'],
  ['/properties/demo', 'Sample rentals'],
  ['/#rental-safety', 'Rental safety'],
  ['/community', 'Community services'],
];

export default function Footer() {
  return (
    <footer className='mt-16 border-t border-emerald-100 bg-white text-slate-700'>
      <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-8 sm:px-8'>
        <div className='flex items-center gap-3'>
          <Image src='/icon.svg' width={36} height={36} alt='' unoptimized />
          <div><p className='font-bold text-brand-800'>TrustNest</p><p className='text-sm'>Everything local. Built on trust.</p></div>
        </div>
        <nav aria-label='Footer' className='flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold'>
          {links.map(([href, label]) => <Link key={href} href={href} className='text-brand-700 hover:underline'>{label}</Link>)}
        </nav>
        <small>© {new Date().getFullYear()} TrustNest</small>
      </div>
    </footer>
  );
}
