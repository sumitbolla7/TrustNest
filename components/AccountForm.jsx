'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { getProviders, signIn } from 'next-auth/react';

const titles = { login: 'Sign in', register: 'Create your account', forgot: 'Reset your password', resend: 'Resend verification', verify: 'Verify your email', reset: 'Choose a new password' };

export default function AccountForm() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = Object.hasOwn(titles, params.get('mode')) ? params.get('mode') : 'login';
  const [visible, setVisible] = useState(false);
  const [google, setGoogle] = useState(false);
  useEffect(() => { let active = true; getProviders().then(providers => { if (active) setGoogle(Boolean(providers?.google)); }).catch(() => {}); return () => { active = false; }; }, []);
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

  const field = 'tn-field';
  return (
    <section className='tn-panel mx-4 my-10 max-w-lg p-5 sm:mx-auto sm:p-9'>
      <ShieldCheck aria-hidden className='mb-4 text-brand-500' size={30} />
      <h1 className='mb-5 text-3xl font-bold text-brand-800'>{titles[mode]}</h1>
      <form className='grid gap-4' onSubmit={submit}>
        {mode === 'register' && <><label>Name<input className={field} name='name' maxLength={60} required /></label>
          <label>Account type<select className={field} name='role' defaultValue={params.get('role') === 'landlord' ? 'landlord' : 'tenant'}><option value='tenant'>Tenant</option><option value='landlord'>Landlord</option></select></label></>}
        {['register', 'login', 'forgot', 'resend'].includes(mode) && <label>Email<input className={field} type='email' name='email' autoComplete='email' maxLength={254} required /></label>}
        {['register', 'login', 'reset'].includes(mode) && <div>
          <label htmlFor='account-password'>Password</label>
          <div className='relative'>
            <input id='account-password' className={field + ' pr-14'} type={visible ? 'text' : 'password'} name='password' maxLength={128} minLength={mode === 'login' ? undefined : 12} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} aria-describedby={mode === 'login' ? undefined : 'password-rule'} required />
            <button type='button' aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)} className='absolute inset-y-0 right-0 grid min-w-12 place-items-center text-slate-700'>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          {mode !== 'login' && <p id='password-rule' className='mt-2 text-sm text-slate-600'>Use 12 to 128 characters.</p>}
        </div>}
        <button disabled={busy} className='tn-button tn-primary'>{busy ? 'Please wait…' : titles[mode]}</button>
        {message && <p role='status'>{message}</p>}
      </form>
      {mode === 'login' && google && <button type='button' className='tn-button tn-secondary mt-4 w-full' onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>Sign in with Google</button>}
      <div className='mt-6 flex flex-wrap gap-3 text-sm text-brand-700 underline'>
        <Link href='/account'>Sign in</Link><Link href='/account?mode=register'>Register</Link><Link href='/account?mode=forgot'>Forgot password</Link><Link href='/account?mode=resend'>Resend verification</Link>
      </div>
    </section>
  );
}
