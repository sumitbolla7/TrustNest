'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { ArrowUpRight, Menu, Plus, UserRound } from 'lucide-react';
import NotificationMenu from './NotificationMenu';

const rentals = [
  ['/properties', 'Rent a Home'],
  ['/properties?propertyType=Private+Room', 'Find a Room'],
  ['/properties?student=1', 'Student Accommodation'],
];
const future = ['Part-Time Jobs', 'Local Services', 'Useful Contacts'];

function closeMenu(event) {
  event.currentTarget.closest('details')?.removeAttribute('open');
}

function RentalLinks({ pathname }) {
  return rentals.map(([href, label]) => <Link key={href} href={href} onClick={closeMenu} aria-current={pathname === href ? 'page' : undefined}
    className='rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-brand-700 aria-[current=page]:bg-emerald-50 aria-[current=page]:text-brand-700'>{label}</Link>);
}

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  return (
    <header className='relative z-30 border-b border-slate-200 bg-white'>
      <div className='mx-auto flex min-h-[4.5rem] max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8'>
        <Link href='/' className='flex min-w-0 items-center gap-2 font-extrabold tracking-tight text-slate-900'>
          <Image src='/icon.svg' alt='' width={36} height={36} unoptimized /><span className='text-xl'>TrustNest</span>
        </Link>
        <nav aria-label='Rental navigation' className='hidden flex-wrap items-center lg:flex'><RentalLinks pathname={pathname} /></nav>
        <div className='flex min-w-0 items-center gap-2'>
          {user ? <>
            <NotificationMenu />
            <details className='group relative'>
              <summary aria-label='Account menu' className='tn-icon cursor-pointer list-none'><UserRound size={18} /></summary>
              <div className='tn-panel absolute right-0 z-40 mt-2 grid w-44 gap-1 p-2 text-sm'>
                <Link href='/dashboard' className='rounded px-3 py-2 hover:bg-slate-100'>Dashboard</Link>
                <Link href='/properties/saved' className='rounded px-3 py-2 hover:bg-slate-100'>Saved rentals</Link>
                <Link href='/messages' className='rounded px-3 py-2 hover:bg-slate-100'>Previous inbox</Link>
                <button type='button' onClick={() => signOut({ callbackUrl: '/' })} className='rounded px-3 py-2 text-left hover:bg-slate-100'>Sign out</button>
              </div>
            </details>
          </> : <>
            <Link href='/account' className='tn-button hidden sm:inline-flex'>Sign in</Link>
            <Link href='/account?mode=register' className='tn-button tn-secondary hidden sm:inline-flex'>Register</Link>
          </>}
          <Link href={user ? '/properties/add' : '/account?mode=register&role=landlord'} className='tn-button tn-primary hidden lg:inline-flex'><Plus size={16} /> List a property</Link>
          <details className='relative lg:hidden'>
            <summary aria-label='Open main menu' className='tn-icon cursor-pointer list-none'><Menu size={21} /></summary>
            <nav aria-label='Mobile navigation' className='tn-panel absolute right-0 z-40 mt-2 grid w-56 gap-1 p-2'>
              <RentalLinks pathname={pathname} />
              {!user && <><Link href='/account' onClick={closeMenu} className='px-3 py-2 text-sm font-semibold'>Sign in</Link><Link href='/account?mode=register' onClick={closeMenu} className='px-3 py-2 text-sm font-semibold'>Register</Link></>}
              <Link href={user ? '/properties/add' : '/account?mode=register&role=landlord'} className='tn-button tn-primary'><Plus size={16} /> List a property</Link>
            </nav>
          </details>
        </div>
      </div>
      <nav aria-label='Future services' className='border-t border-slate-100 bg-slate-50'>
        <div className='mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-1 px-4 py-2 sm:px-8'>
          {future.map(label => <Link key={label} href='/community' className='inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-brand-700'>{label} <span className='text-slate-600'>(Coming soon)</span><ArrowUpRight size={12} /></Link>)}
        </div>
      </nav>
    </header>
  );
}
