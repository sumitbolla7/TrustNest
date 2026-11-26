'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteRental({ id }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function remove() {
    if (!window.confirm('Delete this rental permanently?')) return;
    setBusy(true);
    try {
      const response = await fetch('/api/properties/' + id, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError('Could not delete this rental.');
    } finally {
      setBusy(false);
    }
  }
  return <><button type='button' disabled={busy} onClick={remove} className='rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-800'>Delete</button>{error && <p role='alert'>{error}</p>}</>;
}
