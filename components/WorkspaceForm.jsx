'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkspaceForm({ action, data = {}, endpoint = '/api/workspace', label, children, confirmText, onSuccess }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (confirmText && !window.confirm(confirmText)) return;
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    if (action === 'profile') fields.notifications = fields.notifications === 'on';
    setBusy(true);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, ...data, action }) });
      const body = await response.json().catch(() => null);
      setMessage(body?.message ?? (response.status === 429 ? 'Try again shortly.' : 'The request could not be completed.'));
      if (response.ok) {
        onSuccess?.();
        if (['delete', 'password'].includes(action)) router.replace('/account');
        else {
          if (action === 'message') form.reset();
          router.refresh();
        }
      }
    } catch {
      setMessage('The request could not be completed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className={'grid gap-2 ' + (children ? 'my-3' : 'my-1')}>
      {children}
      <button disabled={busy} className='tn-button tn-secondary w-fit'>{busy ? 'Working…' : label}</button>
      {message && <p className='text-sm' role='status'>{message}</p>}
    </form>
  );
}
