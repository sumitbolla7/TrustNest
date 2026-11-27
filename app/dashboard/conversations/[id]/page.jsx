import { ArrowLeft, MessageCircle } from 'lucide-react';
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
  const member = { $or: [{ tenant: session.userId }, { landlord: session.userId }] };
  const [rawMessages, threads] = await Promise.all([
    ThreadMessage.find({ conversation: id }).sort({ createdAt: -1, _id: -1 }).limit(100).lean(),
    Conversation.find(member).select('property status').sort({ updatedAt: -1 }).limit(40).lean(),
  ]);
  const messages = rawMessages.reverse();
  const threadIds = threads.map(item => item._id);
  const [listings, unseen] = await Promise.all([
    Property.find({ _id: { $in: [...threads.map(item => item.property), thread.property] } }).select('name').lean(),
    ThreadMessage.find({ conversation: { $in: threadIds }, recipient: session.userId, readAt: null }).distinct('conversation'),
  ]);
  const names = new Map(listings.map(item => [String(item._id), item.name]));
  const unread = new Set(unseen.map(String));
  return <section className='mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)]'>
    <aside className='tn-panel p-4'>
      <h2 className='flex items-center gap-2 font-bold'><MessageCircle size={18} /> Conversations</h2>
      <nav aria-label='Conversations' className='mt-3 grid max-h-56 gap-1 overflow-y-auto lg:max-h-[65vh]'>{threads.map(item => { const key = String(item._id); return <Link key={key} href={'/dashboard/conversations/' + key} aria-current={key === id ? 'page' : undefined} className='rounded-lg px-3 py-2 text-sm hover:bg-slate-100 aria-[current=page]:bg-emerald-50 aria-[current=page]:font-semibold'><span className='block break-words'>{names.get(String(item.property)) ?? 'Unavailable rental'}</span><span className='text-xs text-slate-600'>{item.status}{unread.has(key) ? ' · Unread' : ''}</span></Link>; })}</nav>
    </aside>
    <div className='tn-panel min-w-0 space-y-5 p-4 sm:p-6'>
    <RefreshConversation />
    <Link href='/dashboard#messages' className='inline-flex items-center gap-2 text-brand-700 underline'><ArrowLeft size={15} /> Back to dashboard</Link>
    <h1 className='text-3xl font-bold'>{names.get(String(thread.property)) ?? 'Rental enquiry'}</h1>
    <p>Enquiry status: {thread.status}</p>
    <WorkspaceForm action='thread-read' data={{ id }} label='Mark messages as read' />
    <ol className='space-y-3' aria-label='Message history'>{messages.map(item => <li key={String(item._id)} className={'max-w-2xl rounded-2xl border p-4 ' + (String(item.sender) === session.userId ? 'ml-auto border-emerald-200 bg-emerald-50' : 'bg-slate-50')}>
      <p className='text-sm text-slate-600'>{String(item.sender) === session.userId ? 'You' : 'Other participant'} · {new Date(item.createdAt).toLocaleString('en-IE', { timeZone: 'Europe/Dublin' })}</p>
      <p className='mt-2 whitespace-pre-wrap break-words'>{item.body}</p>
    </li>)}</ol>
    {thread.status !== 'closed' && <>
      <WorkspaceForm action='message' data={{ id }} label='Send message'><label>Message<textarea required name='message' maxLength={4000} className='block w-full rounded border p-2' /></label></WorkspaceForm>
      {String(thread.landlord) === session.userId && <WorkspaceForm action='enquiry-status' data={{ id, status: 'closed' }} label='Close enquiry' confirmText='Close this conversation?' />}
    </>}
    </div>
  </section>;
}
