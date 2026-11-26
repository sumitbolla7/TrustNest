import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/utils/getSessionUser';
import { validId } from '@/utils/workspace';
import Property from '@/models/Property';
import ListingForm from '@/components/ListingForm';
import { publicListing } from '@/utils/catalogue';

export default async function EditListing({ params }) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) redirect('/account');
  if (!validId(id)) notFound();
  const record = await Property.findOne({ _id: id, owner: session.userId, status: { $ne: 'removed' }, is_demo: { $ne: true } }).lean();
  if (!record) notFound();
  const rental = { ...publicListing(record), location: record.location };
  return <section className='mx-auto max-w-4xl px-4 py-10'><h1 className='mb-5 text-3xl font-bold'>Edit rental listing</h1><ListingForm rental={rental} /></section>;
}
