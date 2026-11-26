'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';

export default function SavedRentals() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const cancel = new AbortController();
    fetch('/api/bookmarks', { cache: 'no-store', signal: cancel.signal }).then(async response => {
      if (!response.ok) throw new Error(response.status === 401 ? 'Sign in to see your saved rentals.' : 'Saved rentals are unavailable.');
      setResult({ rentals: await response.json() });
    }).catch(error => {
      if (!cancel.signal.aborted) setResult({ error: error.message });
    });
    return () => cancel.abort();
  }, []);

  function update(id, saved) {
    if (!saved) setResult(previous => ({ rentals: previous.rentals.filter(rental => rental._id !== id) }));
  }

  return (
    <section className='mx-auto max-w-7xl px-4 py-10 sm:px-8'>
      <h1 className='mb-6 text-3xl font-bold text-brand-800'>Saved rentals</h1>
      {!result ? <p role='status'>Loading saved rentals…</p> : result.error ? <p role='alert'>{result.error}</p> : result.rentals.length ? (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {result.rentals.map(property => <PropertyCard key={property._id} property={property} saved onSavedChange={update} />)}
        </div>
      ) : <p>No saved rentals yet. <Link href='/properties' className='text-brand-700 underline'>Browse rentals</Link></p>}
    </section>
  );
}
