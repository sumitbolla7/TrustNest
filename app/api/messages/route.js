import { writeLimit } from '@/utils/writeLimit';
import Property from '@/models/Property';
import { objectId, sameOrigin } from '@/utils/security.mjs';
import connectDB from '@/config/database';
import Message from '@/models/Message';
import { getSessionUser } from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

// GET /api/messages
export const GET = async () => {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.user) {
      return new Response(JSON.stringify('User ID is required'), {
        status: 401,
      });
    }

    const { userId } = sessionUser;

    const readMessages = await Message.find({ recipient: userId, read: true })
      .sort({ createdAt: -1 }) // Sort read messages in asc order
      .populate('sender', 'username')
      .populate('property', 'name');

    const unreadMessages = await Message.find({
      recipient: userId,
      read: false,
    })
      .sort({ createdAt: -1 }) // Sort read messages in asc order
      .populate('sender', 'username')
      .populate('property', 'name');

    const messages = [...unreadMessages, ...readMessages];

    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (error) {

    return new Response('Something went wrong', { status: 500 });
  }
};

// POST /api/messages
export const POST = async (request) => {
  if (!sameOrigin(request, process.env.NEXTAUTH_URL)) return new Response('Forbidden origin', { status: 403 });
  try {
    await connectDB();

    const { name, email, phone, message, property } = (await request.json().catch(() => null)) ?? {};
    if (typeof property !== 'string' || !objectId.test(property) ||
        typeof name !== 'string' || !name.trim() || name.length > 100 ||
        typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof message !== 'string' || !message.trim() || message.length > 4000 ||
        (phone != null && (typeof phone !== 'string' || !/^[+0-9 ().-]{0,32}$/.test(phone)))) {
      return new Response('Invalid message details', { status: 400 });
    }

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.user) {
      return new Response(
        JSON.stringify({ message: 'You must be logged in to send a message' }),
        { status: 401 }
      );
    }

    const { user } = sessionUser;

    const listing = await Property.findOne({ _id: property, status: { $in: ['active', null] } }).select('owner is_demo').lean();
    if (!listing || listing.is_demo || !listing.owner) return new Response('Rental enquiries are unavailable', { status: 404 });
    const limited = await writeLimit(sessionUser.userId, 'enquiry', 5);
    if (limited) return limited;
    const recipient = listing.owner.toString();

    // Prevent self-messaging
    if (user.id === recipient) {
      return new Response(
        JSON.stringify({ message: 'Can not send a message to yourself' }),
        { status: 400 }
      );
    }

    const newMessage = new Message({
      sender: user.id,
      recipient,
      property,
      name,
      email,
      phone,
      body: message,
    });

    await newMessage.save();

    return new Response(JSON.stringify({ message: 'Message Sent' }), {
      status: 200,
    });
  } catch (error) {

    return new Response('Something went wrong', { status: 500 });
  }
};
