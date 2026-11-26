import { Suspense } from 'react';
import AccountForm from '@/components/AccountForm';

export default function AccountPage() {
  return <Suspense fallback={<p>Loading account form…</p>}><AccountForm /></Suspense>;
}
