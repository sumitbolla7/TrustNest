import { redirect } from 'next/navigation';
import { getSessionUser } from '@/utils/getSessionUser';
import ListingForm from '@/components/ListingForm';

export const dynamic = 'force-dynamic';

export default async function NewListing() {
  const session = await getSessionUser();
  if (!session) redirect('/account');
  if (session.user.role !== 'landlord') redirect('/unauthorized');
  return <section className='mx-auto max-w-4xl px-4 py-10'><h1 className='mb-5 text-3xl font-bold'>Create a rental listing</h1><ListingForm /></section>;
}
