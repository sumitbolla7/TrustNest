import { counties, furnishings, normaliseTown, validCalendarDate } from './marketplace.mjs';
import { normaliseEircode, rentalTypes } from './ireland.mjs';

export function readListing(form, legacyType) {
  const text = (name, max, required = false) => {
    const value = form.get(name) ?? '';
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('Invalid listing field');
    return value.trim();
  };
  const number = (name, min, max, required = true, whole = false) => {
    const value = text(name, 16, required);
    if (!value) return undefined;
    const parsed = Number(value);
    if (!/^\d+(?:\.\d{1,2})?$/.test(value) || (whole && !Number.isInteger(parsed)) || parsed < min || parsed > max) throw new Error('Invalid number');
    return parsed;
  };
  const type = text('type', 40, true);
  if (!rentalTypes.includes(type) && type !== legacyType) throw new Error('Invalid rental type');
  const amenities = form.getAll('amenities');
  if (amenities.length > 32 || amenities.some(value => typeof value !== 'string' || value.length > 80)) throw new Error('Invalid amenities');
  const phone = text('seller_info.phone', 32);
  const email = text('seller_info.email', 254);
  if ((phone && !/^[+0-9 ().-]+$/.test(phone)) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('Invalid contact');
  const county = text("location.county", 80, true);
  if (!counties.includes(county)) throw new Error("Invalid county");
  const city = text("location.city", 80, true);
  const furnishing = text("furnishing", 24);
  const availability = text("availability", 10);
  if (furnishing && !furnishings.includes(furnishing)) throw new Error("Invalid furnishing");
  if (availability && !validCalendarDate(availability)) throw new Error("Invalid availability");
  return {
    type, amenities, furnishing: furnishing || undefined, availability: availability || undefined,
    shared: type === "Shared Accommodation", student: type === "Student Accommodation",
    name: text('name', 120, true),
    description: text('description', 4000),
    location: {
      street: text('location.street', 150),
      city, county, town_key: normaliseTown(city),
      eircode: normaliseEircode(text('location.eircode', 12)),
    },
    beds: number('beds', 0, 100, true, true),
    baths: number('baths', 0, 100, true, true),
    square_metres: number('square_metres', 1, 100000),
    rates: {
      monthly: number('rates.monthly', 1, 100000, false),
      weekly: number('rates.weekly', 1, 100000, false),
      nightly: number('rates.nightly', 1, 100000, false),
    },
    seller_info: { name: text('seller_info.name', 100), email, phone },
  };
}
