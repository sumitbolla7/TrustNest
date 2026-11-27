import { adminFilters } from '@/utils/adminFilters.mjs';
import connectDB from '@/config/database';
import User from '@/models/User';
import Property from '@/models/Property';
import { Verification, ScamReport, AdminAudit } from '@/models/Marketplace';
import { getSessionUser } from '@/utils/getSessionUser';
import { literalSearch, sameOrigin } from '@/utils/security.mjs';
import { notify, privateJson, problem, validId } from '@/utils/workspace';
import { writeLimit } from '@/utils/writeLimit';

export async function GET(request) {
  const session = await getSessionUser();
  if (session?.user.role !== 'admin') return problem('Administrator access required.', session ? 403 : 401);
  const filters = adminFilters(request.nextUrl.searchParams);
  if (!filters) return problem('Invalid administration filters.');
  const { section, status, search, page, size } = filters;
  try {
    await connectDB();
    const term = search ? literalSearch(search) : null;
    const match = keys => term ? { $or: keys.map(key => ({ [key]: term })) } : {};
    const userStatus = status === 'deleted' ? { deleted: true } : status ? { deleted: { $ne: true }, suspended: status === 'active' ? { $ne: true } : true } : {};
    const specs = {
      users: [User, { ...match(['email', 'username']), ...(section === 'users' ? userStatus : {}) }, 'email username role suspended deleted'],
      properties: [Property, { is_demo: { $ne: true }, ...(section === 'properties' ? { ...match(['name', 'location.city', 'location.county']), ...(status ? { status: status === 'active' ? { $in: ['active', null] } : status } : {}) } : {}) }, 'name type status location.county location.city rates.monthly'],
      verifications: [Verification, section === 'verifications' ? { ...match(['name']), ...(status ? { status } : {}) } : {}],
      reports: [ScamReport, section === 'reports' ? { ...match(['reason', 'description']), ...(status ? { status } : {}) } : {}],
      audit: [AdminAudit, section === 'audit' ? { ...match(['action', 'status']), ...(status ? { outcome: status } : {}) } : {}],
    };
    const rows = Object.entries(specs).filter(([key]) => section === 'all' || key === section);
    const [results, totalRows, registered, tenants, landlords, total, pending, awaitingVerification, openReports] = await Promise.all([
      Promise.all(rows.map(async ([key, [model, query, fields]]) => {
        const sortField = key === 'audit' || key === 'users' ? 'createdAt' : 'updatedAt';
        const list = model.find(query).sort({ [sortField]: -1, _id: -1 }).skip((page - 1) * size).limit(size).lean().maxTimeMS(3000);
        return [key, await (fields ? list.select(fields) : list)];
      })),
      section === 'all' ? 0 : specs[section][0].countDocuments(specs[section][1]).maxTimeMS(3000),
      User.countDocuments({ deleted: { $ne: true } }), User.countDocuments({ role: { $in: ['tenant', null] }, deleted: { $ne: true } }),
      User.countDocuments({ role: 'landlord', deleted: { $ne: true } }), Property.countDocuments(), Property.countDocuments({ status: 'pending' }),
      Verification.countDocuments({ status: 'pending' }), ScamReport.countDocuments({ status: { $in: ['open', 'in-review'] } }),
    ]);
    return privateJson({ ...Object.fromEntries(results), totalRows, page, size, counts: { registered, tenants, landlords, total, pending, awaitingVerification, openReports } });
  } catch {
    return problem('Administration is temporarily unavailable.', 503);
  }
}

export async function POST(request) {
  if (!sameOrigin(request, process.env.NEXTAUTH_URL)) return problem('Forbidden origin', 403);
  const session = await getSessionUser();
  if (session?.user.role !== 'admin') return problem('Administrator access required.', session ? 403 : 401);
  const body = await request.json().catch(() => null);
  if (!validId(body?.id)) return problem('Invalid resource.');
  const { action, id, status } = body;
  const actions = { account: ['suspended', 'active'], listing: ['active', 'rejected', 'removed'], verification: ['approved', 'rejected', 'suspended'], report: ['in-review', 'resolved', 'dismissed'] };
  if (!Object.hasOwn(actions, action) || !actions[action].includes(status)) return problem('Invalid moderation action.');
  try {
    const limited = await writeLimit(session.userId, 'moderate', 30);
    if (limited) return limited;
    const audit = await AdminAudit.create({ administrator: session.userId, target: id, action, status, outcome: 'attempted' });
    let result;
    let recipient;
    if (action === 'account' && ['suspended', 'active'].includes(status)) {
      result = await User.findOneAndUpdate({ _id: id, role: { $ne: 'admin' }, deleted: { $ne: true }, suspended: status === 'suspended' ? { $ne: true } : true }, { $set: { suspended: status === 'suspended' }, $inc: { sessionVersion: 1 } });
    } else if (action === 'listing' && ['active', 'rejected', 'removed'].includes(status)) {
      result = await Property.findOneAndUpdate({ _id: id, is_demo: { $ne: true }, status: status === 'removed' ? { $ne: 'removed' } : 'pending' }, { $set: { status } });
      recipient = result?.owner;
    } else if (action === 'verification' && ['approved', 'rejected', 'suspended'].includes(status)) {
      result = await Verification.findOneAndUpdate({ _id: id, status: status === 'suspended' ? 'approved' : 'pending' }, { $set: { status } });
      if (result) {
        await User.updateOne({ _id: result.landlord }, { $set: { landlordVerification: status } });
        recipient = result.landlord;
      }
    } else if (action === 'report' && ['in-review', 'resolved', 'dismissed'].includes(status)) {
      result = await ScamReport.findOneAndUpdate({ _id: id, status: { $in: status === 'in-review' ? ['open'] : ['open', 'in-review'] } }, { $set: { status } });
      recipient = result?.reporter;
    } else return problem('Invalid moderation action.');
    await AdminAudit.updateOne({ _id: audit._id }, { $set: { outcome: result ? 'applied' : 'unavailable' } });
    if (!result) return problem('This change is unavailable.', 404);
    if (recipient) await notify(recipient, 'TrustNest ' + action + ' update: ' + status, '/dashboard#' + { listing: 'listings', verification: 'landlord-verification', report: 'reports' }[action]);
    return privateJson({ message: 'Moderation updated.' });
  } catch {
    return problem('Moderation is temporarily unavailable.', 503);
  }
}
