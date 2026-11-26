import { rentalTypes } from './ireland.mjs';

export const counties = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry',
  'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth',
  'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary',
  'Waterford', 'Westmeath', 'Wexford', 'Wicklow',
];
export const furnishings = ['Furnished', 'Unfurnished', 'Part-furnished'];
export const marketplaceAmenities = ['Parking', 'Garden', 'Balcony', 'Dishwasher', 'Elevator', 'High-Speed Internet', 'Full Kitchen', 'Washer & Dryer'];
export const sorts = { newest: 'Newest first', rentAsc: 'Lowest monthly rent', rentDesc: 'Highest monthly rent' };
export const normaliseTown = town => town.trim().normalize('NFC').toLocaleLowerCase('en-IE');

export function validCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function formatAvailability(value) {
  return value && validCalendarDate(String(value).slice(0, 10))
    ? new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))
    : 'Ask about availability';
}

export function listingFilters(params) {
  const allowed = ['county', 'town', 'location', 'minRent', 'maxRent', 'propertyType', 'beds', 'baths', 'furnishing', 'availableBy', 'shared', 'student', 'amenity', 'sort', 'page', 'pageSize'];
  const invalid = () => { throw new Error('Check your rental filters and try again'); };
  for (const key of params.keys()) {
    if (!allowed.includes(key) || (key !== 'amenity' && params.getAll(key).length > 1)) invalid();
  }
  const value = key => params.get(key)?.trim() || undefined;
  const choice = (key, options) => {
    const input = value(key);
    if (input && !options.includes(input)) invalid();
    return input;
  };
  const amount = (key, max, decimal = false) => {
    const input = value(key);
    if (input === undefined) return undefined;
    if (!(decimal ? /^\d{1,6}(?:\.\d{1,2})?$/ : /^\d{1,6}$/).test(input) || Number(input) > max) invalid();
    return Number(input);
  };
  const townText = value('town');
  if (townText && (townText.length > 80 || !/^[\p{L}\p{M}\p{N} .’'-]+$/u.test(townText))) invalid();
  const location = value('location');
  if (location && location.length > 100) invalid();
  const minRent = amount('minRent', 100000, true);
  const maxRent = amount('maxRent', 100000, true);
  if (minRent !== undefined && maxRent !== undefined && minRent > maxRent) invalid();
  const availableBy = value('availableBy');
  if (availableBy && !validCalendarDate(availableBy)) invalid();
  const amenities = params.getAll('amenity');
  if (amenities.length > marketplaceAmenities.length || amenities.some(item => !marketplaceAmenities.includes(item))) invalid();
  const page = amount('page', 200) ?? 1;
  const pageSize = amount('pageSize', 24) ?? 9;
  if (!page || !pageSize) invalid();

  return {
    county: choice('county', counties), town: townText && normaliseTown(townText), location,
    minRent, maxRent, propertyType: choice('propertyType', [...rentalTypes, 'All']),
    beds: amount('beds', 100), baths: amount('baths', 100),
    furnishing: choice('furnishing', furnishings), availableBy,
    shared: choice('shared', ['1']) === '1', student: choice('student', ['1']) === '1',
    amenities: [...new Set(amenities)], sort: choice('sort', Object.keys(sorts)) ?? 'newest', page, pageSize,
  };
}
