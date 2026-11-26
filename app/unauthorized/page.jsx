import Link from 'next/link';

export default function Unauthorized() {
  return <section className='mx-auto max-w-3xl px-4 py-16'><h1 className='text-3xl font-bold'>Access unavailable</h1><p className='my-3'>This page requires a different account role.</p><Link href='/dashboard' className='text-brand-700 underline'>Return to your dashboard</Link></section>;
}
