'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { toast } from 'react-toastify';

export default function NotificationMenu() {
  const [result, setResult] = useState(null);
  const refresh = useCallback(async signal => {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store', signal });
      if (response.ok) setResult(await response.json());
    } catch {
      // Keep the last successful private snapshot on a transient failure.
    }
  }, []);
  useEffect(() => {
    const cancel = new AbortController();
    const initial = setTimeout(() => refresh(cancel.signal), 0);
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(cancel.signal); }, 30000);
    return () => { clearTimeout(initial); clearInterval(timer); cancel.abort(); };
  }, [refresh]);
  async function mark(id) {
    try {
      const response = await fetch('/api/workspace', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: id ? 'notification-read' : 'notifications-read', id }),
      });
      if (!response.ok) throw new Error();
      await refresh();
    } catch {
      toast.error('Could not update notifications.');
    }
  }
  return <details className='relative' onToggle={event => { if (event.currentTarget.open) refresh(); }}>
    <summary aria-label={result?.unread ? 'Notifications, ' + result.unread + ' unread' : 'Notifications'} className='tn-icon relative cursor-pointer list-none'>
      <Bell size={18} />
      {!!result?.unread && <span className='absolute -right-1 -top-1 rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white'>{result.unread > 99 ? '99+' : result.unread}</span>}
    </summary>
    <div className='tn-panel fixed left-3 right-3 z-40 mt-2 p-3 sm:absolute sm:left-auto sm:right-0 sm:w-80'>
      <div className='flex flex-wrap items-center justify-between gap-2 px-1 pb-2'>
        <h2 className='font-bold'>Notifications</h2>
        {!!result?.unread && <button type='button' className='text-sm font-semibold text-brand-700 underline' onClick={() => mark()}>Mark all as read</button>}
      </div>
      {!result ? <p className='p-2 text-sm'>Notifications are loading or unavailable.</p> : !result.items.length ? <p className='p-2 text-sm'>No notifications yet.</p> : (
        <ul className='max-h-72 divide-y overflow-y-auto'>{result.items.map(item => <li key={item._id} className='flex items-center gap-2 py-2'>
          <Link href={/^\/dashboard(?:#(?:viewings|listings|landlord-verification|reports|notifications))?$/.test(item.href ?? '') || /^\/dashboard\/conversations\/[a-f0-9]{24}$/i.test(item.href ?? '') ? item.href : '/dashboard#notifications'} className={'min-w-0 flex-1 break-words text-sm hover:underline ' + (!item.readAt ? 'font-semibold' : 'text-slate-600')}>{item.label}</Link>
          {!item.readAt && <button type='button' aria-label='Mark notification as read' onClick={() => mark(item._id)} className='tn-icon shrink-0'><Check size={16} /></button>}
        </li>)}</ul>
      )}
      <Link href='/dashboard#notifications' className='block px-1 pt-2 text-sm font-semibold text-brand-700 underline'>View in dashboard</Link>
    </div>
  </details>;
}
