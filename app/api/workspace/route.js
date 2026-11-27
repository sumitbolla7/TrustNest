import connectDB from '@/config/database';
import { getSessionUser } from '@/utils/getSessionUser';
import { sameOrigin } from '@/utils/security.mjs';
import { validCalendarDate } from '@/utils/marketplace.mjs';
import { writeLimit } from '@/utils/writeLimit';
import { reportReasons, viewingTransition } from '@/utils/workflow.mjs';
import { cleanText, notify, privateJson, problem, validId } from '@/utils/workspace';
import Property from '@/models/Property';
import User from '@/models/User';
import { Conversation, ThreadMessage, Viewing, Verification, ScamReport, Notification } from '@/models/Marketplace';

export async function GET(request) {
  const session = await getSessionUser();
  if (!session) return problem('Sign in first.', 401);
  const id = request.nextUrl.searchParams.get('conversation');
  if (!validId(id)) return problem('Invalid conversation.');
  try {
    const membership = { $or: [{ tenant: session.userId }, { landlord: session.userId }] };
    const conversation = await Conversation.findOne({ _id: id, ...membership }).lean();
    if (!conversation) return problem('Conversation not found.', 404);
    const messages = await ThreadMessage.find({ conversation: id }).sort({ createdAt: -1, _id: -1 }).limit(100).lean();
    return privateJson({ conversation, messages: messages.reverse() });
  } catch {
    return problem('Conversation unavailable.', 503);
  }
}

export async function POST(request) {
  if (!sameOrigin(request, process.env.NEXTAUTH_URL)) return problem('Forbidden origin', 403);
  const session = await getSessionUser();
  if (!session) return problem('Sign in first.', 401);
  if (Number(request.headers.get('content-length')) > 12000) return problem('Request too large.', 413);
  const body = await request.json().catch(() => null);
  const { userId, user: { role } } = session;
  const action = body?.action;

  try {
    await connectDB();
    const limited = await writeLimit(userId, 'workspace', 35);
    if (limited) return limited;
    if (action === 'notification-read' || action === 'notifications-read') {
      if (action === 'notification-read' && !validId(body.id)) return problem('Invalid notification.');
      await Notification.updateMany({ user: userId, readAt: null, ...(action === 'notification-read' ? { _id: body.id } : {}) }, { $set: { readAt: new Date() } });
      return privateJson({ message: 'Notifications updated.' });
    }

    if (action === 'listing-status') {
      if (role !== 'landlord' || !validId(body.id)) return problem('Landlord access required.', 403);
      const transitions = { rented: ['active', null], active: ['rented'], pending: ['draft', 'rejected', 'rented'] };
      if (!Object.hasOwn(transitions, body.status)) return problem('Invalid listing status.');
      const updated = await Property.updateOne({ _id: body.id, owner: userId, is_demo: { $ne: true }, status: { $in: transitions[body.status] } }, { $set: { status: body.status } });
      return updated.modifiedCount ? privateJson({ message: 'Listing status updated.' }) : problem('Listing change unavailable.', 404);
    }

    if (action === 'verification') {
      if (role !== 'landlord') return problem('Landlord access required.', 403);
      const name = cleanText(body.name, 100);
      const statement = cleanText(body.statement, 600);
      if (!name || !statement) return problem('Provide a name and verification statement.');
      const previous = await Verification.findOne({ landlord: userId }).select('status').lean();
      if (previous && ['pending', 'approved', 'suspended'].includes(previous.status)) return problem('A verification submission is already on file.', 409);
      await Verification.updateOne({ landlord: userId, ...(previous ? { status: 'rejected' } : { status: { $exists: false } }) }, { $set: { name, statement, status: 'pending' } }, { upsert: !previous });
      return privateJson({ message: 'Verification submitted.' }, 201);
    }

    if (action === 'viewing-update') {
      const from = viewingTransition(role, body.status);
      if (!from || !validId(body.id)) return problem('Invalid viewing change.');
      const viewing = await Viewing.findOneAndUpdate({ _id: body.id, [role]: userId, status: { $in: from } }, { $set: { status: body.status } }, { new: true }).lean();
      if (!viewing) return problem('Viewing request unavailable.', 404);
      await notify(role === 'tenant' ? viewing.landlord : viewing.tenant, 'Viewing request: ' + body.status, '/dashboard#viewings');
      return privateJson({ message: 'Viewing updated.' });
    }

    if (action === 'message' || action === 'thread-read' || action === 'enquiry-status') {
      if (!validId(body.id)) return problem('Invalid conversation.');
      const conversation = await Conversation.findOne({ _id: body.id, $or: [{ tenant: userId }, { landlord: userId }] }).lean();
      if (!conversation) return problem('Conversation not found.', 404);
      if (action === 'thread-read') {
        await ThreadMessage.updateMany({ conversation: body.id, recipient: userId, readAt: null }, { $set: { readAt: new Date() } });
        return privateJson({ message: 'Messages marked as read.' });
      }
      if (action === 'enquiry-status') {
        if (String(conversation.landlord) !== userId || !['answered', 'closed'].includes(body.status)) return problem('Enquiry status cannot be changed.', 403);
        await Conversation.updateOne({ _id: body.id, landlord: userId, status: { $ne: 'closed' } }, { $set: { status: body.status } });
        await notify(conversation.tenant, 'Rental enquiry: ' + body.status, '/dashboard/conversations/' + body.id);
        return privateJson({ message: 'Enquiry updated.' });
      }
      const message = cleanText(body.message, 4000);
      if (!message || conversation.status === 'closed') return problem('Enter a message in an open conversation.');
      const recipient = String(conversation.tenant) === userId ? conversation.landlord : conversation.tenant;
      if (!await User.exists({ _id: recipient, suspended: { $ne: true } })) return problem('Recipient unavailable.', 404);
      await ThreadMessage.create({ conversation: conversation._id, sender: userId, recipient, body: message });
      await Conversation.updateOne({ _id: conversation._id, status: { $ne: 'closed' } }, { $set: { status: String(conversation.landlord) === userId ? 'answered' : 'open' } });
      await notify(recipient, 'New rental message', '/dashboard/conversations/' + conversation._id);
      return privateJson({ message: 'Message sent.' }, 201);
    }

    if (!['enquiry', 'viewing', 'report'].includes(action) || !validId(body.property)) return problem('Invalid rental request.');
    const property = await Property.findOne({ _id: body.property, status: { $in: ['active', null] } }).select('owner is_demo').lean();
    if (!property || property.is_demo || !property.owner || String(property.owner) === userId) return problem('This listing cannot receive that request.', 404);

    if (action === 'report') {
      const description = cleanText(body.description, 2000);
      if (!reportReasons.includes(body.reason) || description === null) return problem('Choose a reason and check the description.');
      await ScamReport.create({ reporter: userId, property: property._id, reason: body.reason, description });
      return privateJson({ message: 'Report received for private review.' }, 201);
    }

    if (role !== 'tenant') return problem('Tenant access required.', 403);
    if (!await User.exists({ _id: property.owner, suspended: { $ne: true } })) return problem('This landlord cannot receive requests.', 404);
    if (action === 'viewing') {
      const message = cleanText(body.message, 600);
      if (typeof body.date !== 'string' || !validCalendarDate(body.date) || body.date < new Date().toISOString().slice(0, 10) ||
          typeof body.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time) || message === null) return problem('Choose a future viewing date and valid time.');
      await Viewing.create({ property: property._id, tenant: userId, landlord: property.owner, date: body.date, time: body.time, message });
      await notify(property.owner, 'New viewing request', '/dashboard#viewings');
      return privateJson({ message: 'Viewing requested.' }, 201);
    }
    const message = cleanText(body.message, 4000);
    if (!message) return problem('Enter a rental enquiry.');
    const participants = { property: property._id, tenant: userId, landlord: property.owner };
    const conversation = await Conversation.findOneAndUpdate(participants, { $setOnInsert: { status: 'open' } }, { upsert: true, new: true });
    if (conversation.status === 'closed') return problem('This enquiry is closed.', 409);
    await ThreadMessage.create({ conversation: conversation._id, sender: userId, recipient: property.owner, body: message });
    await Conversation.updateOne({ _id: conversation._id }, { $set: { updatedAt: new Date() } });
    await notify(property.owner, 'New rental enquiry', '/dashboard/conversations/' + conversation._id);
    return privateJson({ message: 'Enquiry sent.', conversation: String(conversation._id) }, 201);
  } catch (error) {
    return error.code === 11000 ? problem('A submission already exists.', 409) : problem('This operation is temporarily unavailable.', 503);
  }
}
