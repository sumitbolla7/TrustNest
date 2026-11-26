'use client';

export default function AppError({ reset }) {
  return <section className='mx-auto max-w-2xl px-4 py-16'><h1 className='text-3xl font-bold'>Something went wrong</h1><p className='my-3'>Try again in a moment.</p><button onClick={reset} className='rounded bg-brand-700 px-4 py-2 text-white'>Try again</button></section>;
}
