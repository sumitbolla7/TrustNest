'use client';
import { useState } from 'react';

export default function CopyRentalLink() {
  const [message, setMessage] = useState('');
  return <>
    <button type='button' className='ml-2 rounded-lg border px-3 py-2 text-sm font-semibold' onClick={async () => {
      try {
        await navigator.clipboard.writeText(window.location.origin + window.location.pathname);
        setMessage('Link copied.');
      } catch {
        setMessage('Copy the rental link from your address bar.');
      }
    }}>Share link</button>
    {message && <p role='status' className='mt-2 text-sm'>{message}</p>}
  </>;
}
