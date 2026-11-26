import mongoose from 'mongoose';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import connectDB from '@/config/database';
import User from '@/models/User';
import Property from '@/models/Property';
import { Conversation, ThreadMessage, Viewing, Verification, ScamReport, Notification } from '@/models/Marketplace';
import { getSessionUser } from '@/utils/getSessionUser';
import WorkspaceForm from '@/components/WorkspaceForm';
import DeleteRental from '@/components/DeleteRental';

const field = 'mt-1 w-full rounded border border-slate-300 p-2';
const link = 'text-brand-700 font-semibold underline';
function Panel({ title, children }) {
  return <section className='rounded-xl border bg-white p-5'><h2 className='mb-3 text-xl font-bold text-brand-800'>{title}</h2>{children}</section>;
}

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const session = await getSessionUser();
  if (!session) redirect('/account');
  if (session.user.role === 'admin') redirect('/dashboard/admin');
  await connectDB();
  const id = session.userId;
  const role = session.user.role;
  const landlord = role === 'landlord';
  const scope = { [landlord ? 'landlord' : 'tenant']: id };
  const [account, listings, totals, conversations, viewings, verification, reports, notices, unread, unreadMessages, savedCount] = await Promise.all([
    User.findById(id).select('username notificationsEnabled').lean(),
    landlord ? Property.find({ owner: id }).select('name status updatedAt').sort({ updatedAt: -1 }).limit(50).lean() : [],
    landlord ? Property.aggregate([{ $match: { owner: new mongoose.Types.ObjectId(id) } }, { $group: { _id: { $ifNull: ['$status', 'active'] }, total: { $sum: 1 } } }]) : [],
    Conversation.find(scope).sort({ updatedAt: -1 }).limit(50).lean(),
    Viewing.find(scope).sort({ createdAt: -1 }).limit(50).lean(),
    landlord ? Verification.findOne({ landlord: id }).select('status').lean() : null,
    ScamReport.find({ reporter: id }).select('reason status').sort({ createdAt: -1 }).limit(50).lean(),
    Notification.find({ user: id }).sort({ createdAt: -1 }).limit(40).lean(),
    Notification.countDocuments({ user: id, readAt: null }),
    ThreadMessage.aggregate([{ $match: { recipient: new mongoose.Types.ObjectId(id), readAt: null } }, { $group: { _id: '$conversation', total: { $sum: 1 } } }]),
    Property.countDocuments({ status: { $in: ['active', null] }, _id: { $in: (await User.findById(id).select('bookmarks').lean())?.bookmarks ?? [] } }),
  ]);
  const unreadByThread = Object.fromEntries(unreadMessages.map(item => [String(item._id), item.total]));
  const rentalIds = [...new Set([...conversations, ...viewings].map(item => String(item.property)))];
  const rentalNames = Object.fromEntries((await Property.find({ _id: { $in: rentalIds } }).select('name').lean()).map(item => [String(item._id), item.name]));
  const counts = Object.fromEntries(totals.map(item => [item._id, item.total]));
  return (
    <section className='mx-auto max-w-7xl px-4 py-10 sm:px-8'>
      <h1 className='text-3xl font-bold text-brand-800'>{landlord ? 'Landlord' : 'Tenant'} dashboard</h1>
      <p className='my-3'>Signed in as {session.user.name}. {unread} unread notifications.</p>
      <div className='mb-6 flex flex-wrap gap-4'>
        <Link className={link} href='/properties/saved'>Saved rentals ({savedCount})</Link>
        <Link className={link} href='/messages'>Previous messages</Link>
        {landlord && <Link className={link} href='/properties/add'>Create a listing</Link>}
      </div>
      <div className='grid gap-5 lg:grid-cols-2'>
        {landlord && <>
          <Panel title='Listings'>
            <p>{totals.reduce((sum, row) => sum + row.total, 0)} total · {counts.active ?? 0} active · {counts.pending ?? 0} pending · {(counts.rented ?? 0) + (counts.removed ?? 0)} unavailable</p>
            {!listings.length && <p className='mt-3'>You have no listings yet.</p>}
            <ul className='divide-y'>{listings.map(item => {
              const key = String(item._id);
              const status = item.status ?? 'active';
              return <li key={key} className='py-3'><p className='font-semibold'>{item.name} · {status}</p>{item.updatedAt && <p className='text-sm text-slate-600'>Last updated {new Date(item.updatedAt).toLocaleString('en-IE', { timeZone: 'Europe/Dublin' })}</p>}
                <div className='mt-2 flex flex-wrap items-center gap-3'>
                  {status !== 'removed' && <><Link className={link} href={'/properties/' + key + '?preview=1'}>Preview</Link><Link className={link} href={'/properties/' + key + '/edit'}>Edit</Link></>}
                  <DeleteRental id={key} />
                  {['active', 'rented', 'draft', 'rejected'].includes(status) && <WorkspaceForm action='listing-status' data={{ id: key, status: status === 'active' ? 'rented' : 'pending' }} label={status === 'active' ? 'Mark rented' : 'Submit for approval'} />}
                  {status === 'rented' && <WorkspaceForm action='listing-status' data={{ id: key, status: 'active' }} label='Mark available' />}
                </div>
              </li>;
            })}</ul>
          </Panel>
          <Panel title='Landlord verification'>
            <p>Status: {verification?.status ?? 'Not submitted'}</p>
            <p className='mt-2 text-sm'>TrustNest review is a platform check. Government certification is outside its scope.</p>
            {(!verification || verification.status === 'rejected') && <WorkspaceForm action='verification' label='Submit for review'>
              <label>Public letting name<input name='name' required maxLength={100} className={field} /></label>
              <label>Explain your authority to let the property<textarea name='statement' required maxLength={600} className={field} /></label>
              <p className='text-sm'>Leave out passports, bank details and other identity documents.</p>
            </WorkspaceForm>}
          </Panel>
        </>}
        <Panel title='Enquiries and messages'>
          {!conversations.length && <p>No conversations yet.</p>}
          <ul className='space-y-3'>{conversations.map(item => <li key={String(item._id)}><Link href={'/dashboard/conversations/' + item._id} className={link}>{rentalNames[String(item.property)] ?? 'Unavailable rental'}</Link> · {item.status}{unreadByThread[String(item._id)] ? ' · ' + unreadByThread[String(item._id)] + ' unread' : ''}</li>)}</ul>
        </Panel>
        <Panel title='Viewing requests'>
          {!viewings.length && <p>No viewing requests yet.</p>}
          <ul className='divide-y'>{viewings.map(item => <li key={String(item._id)} className='py-3'>
            <p>{rentalNames[String(item.property)] ?? 'Unavailable rental'} · {item.date} at {item.time} · {item.status}</p>
            {item.message && <p className='break-words text-sm'>{item.message}</p>}
            <div className='flex flex-wrap gap-2'>{(landlord ? item.status === 'pending' ? ['accepted', 'declined'] : item.status === 'accepted' ? ['completed'] : [] : ['pending', 'accepted'].includes(item.status) ? ['cancelled'] : []).map(status => <WorkspaceForm key={status} action='viewing-update' data={{ id: String(item._id), status }} label={{accepted:'Accept',declined:'Decline',completed:'Mark complete',cancelled:'Cancel request'}[status]} />)}</div>
          </li>)}</ul>
        </Panel>
        <Panel title='Submitted reports'>
          {!reports.length && <p>No reports submitted.</p>}
          <ul>{reports.map(item => <li key={String(item._id)}>{item.reason} · {item.status}</li>)}</ul>
        </Panel>
        <Panel title='Notifications'>
          {unread > 0 && <WorkspaceForm action='notifications-read' label='Mark all as read' />}
          {!notices.length && <p>No notifications yet.</p>}
          <ul className='divide-y'>{notices.map(item => <li key={String(item._id)} className='py-2'>
            <Link className={link} href={item.href}>{item.label}</Link> · {new Date(item.createdAt).toLocaleString('en-IE', { timeZone: 'Europe/Dublin' })}
            {!item.readAt && <WorkspaceForm action='notification-read' data={{ id: String(item._id) }} label='Mark as read' />}
          </li>)}</ul>
        </Panel>
        <Panel title='Profile and account settings'>
          <WorkspaceForm action='profile' endpoint='/api/account' label='Save profile'>
            <label>Name<input name='name' defaultValue={account?.username} required maxLength={60} className={field} /></label>
            <label><input type='checkbox' name='notifications' defaultChecked={account?.notificationsEnabled !== false} /> Receive in-app notifications</label>
          </WorkspaceForm>
          <details><summary className='cursor-pointer'>Change password</summary>
            <WorkspaceForm action='password' endpoint='/api/account' label='Change password'>
              <label>Current password<input type='password' name='current' autoComplete='current-password' maxLength={128} required className={field} /></label>
              <label>New password<input type='password' name='password' autoComplete='new-password' minLength={12} maxLength={128} required className={field} /></label>
            </WorkspaceForm>
          </details>
          <details className='mt-2'><summary className='cursor-pointer text-red-800'>Delete account</summary>
            <WorkspaceForm action='delete' endpoint='/api/account' label='Delete my account' confirmText='Permanently close this account?'>
              <label>Type DELETE to confirm<input name='confirmation' required className={field} /></label>
              <label>Current password (if set)<input name='current' type='password' autoComplete='current-password' maxLength={128} className={field} /></label>
            </WorkspaceForm>
          </details>
        </Panel>
      </div>
    </section>
  );
}
