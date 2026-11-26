'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';

export default function BookmarkButton({ property, initiallySaved = false, onSavedChange }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [bookmark, setBookmark] = useState(null);
  const [busy, setBusy] = useState(false);
  const id = property._id;
  const key = `${userId}:${id}`;
  const saved = bookmark?.key === key ? bookmark.saved : Boolean(userId && initiallySaved);
  const checking = userId && !initiallySaved && bookmark?.key !== key;

  useEffect(() => {
    if (!userId || initiallySaved) return;
    const cancel = new AbortController();
    fetch('/api/bookmarks/check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: id }), signal: cancel.signal,
    }).then(async response => {
      setBookmark({ key, saved: response.ok && (await response.json()).isBookmarked });
    }).catch(() => {
      if (!cancel.signal.aborted) setBookmark({ key, saved: false });
    });
    return () => cancel.abort();
  }, [id, userId, key, initiallySaved]);

  async function update() {
    if (!userId) {
      toast.info('Sign in to save rentals.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id, saved: !saved }),
      });
      if (!response.ok) throw new Error(response.status === 429 ? 'Too many changes. Try again shortly.' : 'Could not update this saved rental.');
      const result = await response.json();
      setBookmark({ key, saved: result.isBookmarked });
      onSavedChange?.(id, result.isBookmarked);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type='button' onClick={update} disabled={busy || checking || status === 'loading'} aria-pressed={saved} aria-label={saved ? `Remove ${property.name} from saved rentals` : `Save ${property.name}`}
      className='inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-emerald-50 disabled:opacity-60'>
      {saved ? <FaBookmark aria-hidden /> : <FaRegBookmark aria-hidden />}
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
