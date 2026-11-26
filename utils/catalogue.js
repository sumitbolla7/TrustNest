import User from '@/models/User';
import connectDB from '@/config/database';
import { demoListings } from '@/config/demoListings.mjs';
import Property from '@/models/Property';
import { literalSearch } from '@/utils/security.mjs';
import { normaliseTown } from '@/utils/marketplace.mjs';

const sorts = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  rentAsc: { 'rates.monthly': 1, _id: 1 },
  rentDesc: { 'rates.monthly': -1, _id: -1 },
};

export const publicListingFields = 'name type description location.city location.county location.state beds baths square_metres square_feet amenities rates images furnishing availability shared student is_demo is_featured createdAt deposit ber conditions';

export function publicListing(listing) {
  const { _id, name, type, description, location, beds, baths, square_metres, square_feet, amenities, rates, images, furnishing, availability, shared, student, is_demo, is_featured, createdAt, deposit, ber, conditions } = listing;
  return { _id: String(_id), name, type, description, location: { city: location?.city, county: location?.county ?? location?.state },
    beds, baths, square_metres, square_feet, amenities, rates, images: (images ?? []).filter(safeImage), furnishing, availability, shared, student, is_demo, is_featured, createdAt, deposit, ber, conditions, landlord: listing.landlord };
}

function safeImage(image) {
  if (['/rentals/house.svg', '/rentals/shared.svg', '/rentals/apartment.svg'].includes(image)) return true;
  try {
    const url = new URL(image);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && !url.port && !url.username && !url.password;
  } catch {
    return false;
  }
}

function mongoFilter(filters, featured) {
  const query = { status: { $in: ['active', null] } };
  const clauses = [];
  if (featured) query.is_featured = true;
  if (filters.county) query['location.county'] = filters.county;
  if (filters.town) clauses.push({ $or: [
    { 'location.town_key': filters.town },
    { 'location.town_key': { $exists: false }, 'location.city': { $regex: `^${literalSearch(filters.town).source}$`, $options: 'i' } },
  ] });
  if (filters.propertyType && filters.propertyType !== 'All') query.type = filters.propertyType;
  if (filters.minRent !== undefined || filters.maxRent !== undefined || ['rentAsc', 'rentDesc'].includes(filters.sort)) {
    query['rates.monthly'] = { $gte: Math.max(1, filters.minRent ?? 1) };
    if (filters.maxRent !== undefined) query['rates.monthly'].$lte = filters.maxRent;
  }
  for (const key of ['beds', 'baths', 'furnishing']) {
    if (filters[key] !== undefined) query[key] = filters[key];
  }
  if (filters.availableBy) query.availability = { $gte: '0001-01-01', $lte: filters.availableBy };
  if (filters.shared) clauses.push({ $or: [{ shared: true }, { type: 'Shared Accommodation' }] });
  if (filters.student) clauses.push({ $or: [{ student: true }, { type: 'Student Accommodation' }] });
  if (filters.amenities?.length) query.amenities = { $all: filters.amenities };
  if (filters.location) {
    const pattern = literalSearch(filters.location);
    clauses.push({ $or: ['name', 'description', 'location.city', 'location.county'].map(key => ({ [key]: pattern })) });
  }
  if (clauses.length) query.$and = clauses;
  return query;
}

function matchDemo(listing, f, featured) {
  const rent = listing.rates.monthly;
  const text = literalSearch(f.location ?? '');
  return !f.verified && (!featured || listing.is_featured) &&
    (!f.county || f.county === listing.location.county) &&
    (!f.town || f.town === normaliseTown(listing.location.city)) &&
    (!f.propertyType || f.propertyType === 'All' || f.propertyType === listing.type) &&
    (f.minRent === undefined || rent >= f.minRent) && (f.maxRent === undefined || rent <= f.maxRent) &&
    (f.beds === undefined || f.beds === listing.beds) && (f.baths === undefined || f.baths === listing.baths) &&
    (!f.furnishing || f.furnishing === listing.furnishing) &&
    (!f.availableBy || listing.availability <= f.availableBy) &&
    (!f.shared || listing.shared) && (!f.student || listing.student) &&
    (f.amenities ?? []).every(item => listing.amenities.includes(item)) &&
    [listing.name, listing.description, listing.location.city, listing.location.county].some(value => text.test(value));
}

export async function listRentals(filters, { featured = false, sample = false } = {}) {
  const skip = (filters.page - 1) * filters.pageSize;
  if (sample || !process.env.MONGODB_URI) {
    const matches = demoListings.filter(listing => matchDemo(listing, filters, featured));
    matches.sort((a, b) => ['newest', 'oldest'].includes(filters.sort)
      ? (a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id)) * (filters.sort === 'newest' ? -1 : 1)
      : (a.rates.monthly - b.rates.monthly) * (filters.sort === 'rentAsc' ? 1 : -1) || a._id.localeCompare(b._id));
    return { total: matches.length, properties: matches.slice(skip, skip + filters.pageSize).map(publicListing) };
  }
  await connectDB();
  const query = mongoFilter(filters, featured);
  if (filters.verified) query.owner = { $in: await User.distinct('_id', { role: 'landlord', landlordVerification: 'approved', suspended: { $ne: true } }).maxTimeMS(3000) };
  const [total, properties] = await Promise.all([
    Property.countDocuments(query).maxTimeMS(3000),
    Property.find(query).select(publicListingFields).sort(sorts[filters.sort]).skip(skip).limit(filters.pageSize).lean().maxTimeMS(3000),
  ]);
  return { total, properties: properties.map(publicListing) };
}

export async function findRental(id, { sample = false } = {}) {
  if (sample || !process.env.MONGODB_URI) {
    const listing = demoListings.find(item => item._id === id);
    return listing ? publicListing(listing) : null;
  }
  await connectDB();
  const listing = await Property.findOne({ _id: id, status: { $in: ['active', null] } }).select(publicListingFields + ' owner').lean().maxTimeMS(3000);
  if (!listing) return null;
  const landlord = listing.owner && await User.findOne({ _id: listing.owner, suspended: { $ne: true } }).select('username landlordVerification role').lean();
  return publicListing({ ...listing, landlord: landlord ? { name: landlord.username, verified: landlord.role === 'landlord' && landlord.landlordVerification === 'approved' } : undefined });
}
