import { Suspense } from 'react';
import AccountForm from '@/components/AccountForm';

export const metadata = { title: 'Sign in or register | TrustNest', description: 'Access your private TrustNest account.', robots: { index: false, follow: false } };

export default function AccountPage() {
  return <Suspense fallback={<p>Loading account form…</p>}><AccountForm /></Suspense>;
}
