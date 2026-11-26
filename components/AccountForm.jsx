'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const titles = { login: 'Sign in', register: 'Create your account', forgot: 'Reset your password', resend: 'Resend verification', verify: 'Verify your email', reset: 'Choose a new password' };

export default function AccountForm() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = Object.hasOwn(titles, params.get('mode')) ? params.get('mode') : 'login';
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'login') {
        const result = await signIn('credentials', { ...data, redirect: false, callbackUrl: '/dashboard' });
        if (result?.ok && !result.error) { router.replace('/dashboard'); router.refresh(); }
        else setMessage('Unable to sign in. Check your credentials and verification status.');
        return;
      }
      const response = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, action: mode, token: params.get('token') }) });
      setMessage((await response.json().catch(() => null))?.message ?? 'Account service unavailable.');
    } catch {
      setMessage('Account service unavailable.');
    } finally {
      setBusy(false);
    }
  }

  const field = 'mt-1 w-full rounded border border-slate-300 p-2';
  return (
    <section className='mx-auto my-12 max-w-lg rounded-2xl border bg-white p-6 sm:p-9'>
      <h1 className='mb-5 text-3xl font-bold text-brand-800'>{titles[mode]}</h1>
      <form className='grid gap-4' onSubmit={submit}>
        {mode === 'register' && <><label>Name<input className={field} name='name' maxLength={60} required /></label>
          <label>Account type<select className={field} name='role' defaultValue={params.get('role') === 'landlord' ? 'landlord' : 'tenant'}><option value='tenant'>Tenant</option><option value='landlord'>Landlord</option></select></label></>}
        {['register', 'login', 'forgot', 'resend'].includes(mode) && <label>Email<input className={field} type='email' name='email' autoComplete='email' maxLength={254} required /></label>}
        {['register', 'login', 'reset'].includes(mode) && <label>Password<input className={field} type='password' name='password' maxLength={128} minLength={mode === 'login' ? undefined : 12} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>}
        <button disabled={busy} className='rounded-lg bg-brand-700 p-3 font-semibold text-white'>{busy ? 'Please wait…' : titles[mode]}</button>
        {message && <p role='status'>{message}</p>}
      </form>
      <div className='mt-6 flex flex-wrap gap-3 text-sm text-brand-700 underline'>
        <Link href='/account'>Sign in</Link><Link href='/account?mode=register'>Register</Link><Link href='/account?mode=forgot'>Forgot password</Link><Link href='/account?mode=resend'>Resend verification</Link>
      </div>
    </section>
  );
}
