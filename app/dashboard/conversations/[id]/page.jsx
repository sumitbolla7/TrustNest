import RefreshConversation from '@/components/RefreshConversation';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/utils/getSessionUser';
import { validId } from '@/utils/workspace';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import { Conversation, ThreadMessage } from '@/models/Marketplace';
import WorkspaceForm from '@/components/WorkspaceForm';

export default async function ConversationPage({ params }) {
  const { id } = await params;
  if (!validId(id)) notFound();
  const session = await getSessionUser();
  if (!session) redirect('/account');
  await connectDB();
  const thread = await Conversation.findOne({ _id: id, $or: [{ tenant: session.userId }, { landlord: session.userId }] }).lean();
  if (!thread) notFound();
  const messages = (await ThreadMessage.find({ conversation: id }).sort({ createdAt: -1, _id: -1 }).limit(100).lean()).reverse();
  const listing = await Property.findById(thread.property).select('name').lean();
  return <section className='mx-auto max-w-3xl space-y-5 px-4 py-10'>
    <RefreshConversation />
    <Link href='/dashboard' className='text-brand-700 underline'>Back to dashboard</Link>
    <h1 className='text-3xl font-bold'>{listing?.name ?? 'Rental enquiry'}</h1>
    <p>Enquiry status: {thread.status}</p>
    <WorkspaceForm action='thread-read' data={{ id }} label='Mark messages as read' />
    <ol className='space-y-3'>{messages.map(item => <li key={String(item._id)} className='rounded-xl border bg-white p-4'>
      <p className='text-sm text-slate-600'>{String(item.sender) === session.userId ? 'You' : 'Other participant'} · {new Date(item.createdAt).toLocaleString('en-IE', { timeZone: 'Europe/Dublin' })}</p>
      <p className='mt-2 whitespace-pre-wrap break-words'>{item.body}</p>
    </li>)}</ol>
    {thread.status !== 'closed' && <>
      <WorkspaceForm action='message' data={{ id }} label='Send message'><label>Message<textarea required name='message' maxLength={4000} className='block w-full rounded border p-2' /></label></WorkspaceForm>
      {String(thread.landlord) === session.userId && <WorkspaceForm action='enquiry-status' data={{ id, status: 'closed' }} label='Close enquiry' confirmText='Close this conversation?' />}
    </>}
  </section>;
}
