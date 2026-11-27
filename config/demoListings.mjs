import { photoGroup } from './photoLibrary.mjs';
import { counties, normaliseTown } from '../utils/marketplace.mjs';

const towns = [
  'Carlow', 'Cavan', 'Ennis', 'Cork', 'Letterkenny', 'Dublin', 'Galway', 'Tralee',
  'Naas', 'Kilkenny', 'Portlaoise', 'Carrick-on-Shannon', 'Limerick', 'Longford', 'Dundalk',
  'Castlebar', 'Navan', 'Monaghan', 'Tullamore', 'Roscommon', 'Sligo', 'Clonmel',
  'Waterford', 'Athlone', 'Wexford', 'Bray',
];
const locations = counties.map((county, i) => [county, towns[i]]).concat([
  ['Dublin', 'Dún Laoghaire'], ['Cork', 'Cobh'], ['Galway', 'Oranmore'], ['Limerick', 'Castletroy'],
  ['Waterford', 'Tramore'], ['Kildare', 'Maynooth'], ['Meath', 'Trim'], ['Wicklow', 'Greystones'],
  ['Donegal', 'Buncrana'], ['Kerry', 'Killarney'], ['Cork', 'Midleton'], ['Galway', 'Athenry'],
  ['Limerick', 'Newcastle West'], ['Wexford', 'Gorey'], ['Clare', 'Shannon'], ['Mayo', 'Westport'],
  ['Offaly', 'Birr'], ['Westmeath', 'Mullingar'], ['Sligo', 'Strandhill'],
]);
const types = ['Apartment', 'House', 'Studio', 'Shared Accommodation', 'Student Accommodation', 'Private Room', 'Cabin Or Cottage', 'Apartment', 'House'];
const exteriorGroups = { Apartment: 'apartments', House: 'houses', Studio: 'apartments', 'Shared Accommodation': 'terraced', 'Student Accommodation': 'student', 'Private Room': 'terraced', 'Cabin Or Cottage': 'cottages' };
const used = new Set();
const interiors = photoGroup('interiors');
const residences = ['apartments', 'houses', 'terraced', 'cottages', 'student'].flatMap(photoGroup);
export const demoListings = locations.map(([county, city], i) => {
  const type = types[i % types.length];
  const houseFormat = ['terraced house', 'semi-detached house', 'detached house'][i % 3];
  const roomPrice = type === 'Private Room' || type.includes('Accommodation');
  const monthly = (roomPrice ? 560 : 970) + (i * 139) % (roomPrice ? 440 : 980) + (county === 'Dublin' ? 350 : 0);
  const group = type === 'House' && houseFormat === 'terraced house' ? 'terraced' : exteriorGroups[type];
  const matching = photoGroup(group);
  const alternatives = type === 'Student Accommodation' ? photoGroup('apartments') : residences;
  const cover = matching.find(photo => !used.has(photo.path)) ?? alternatives.find(photo => !used.has(photo.path)) ?? residences.find(photo => !used.has(photo.path)) ?? matching[i % matching.length];
  if (cover) used.add(cover.path);
  const preferredRoom = type === 'Private Room' || type.includes('Accommodation') ? 'bedroom' : i % 4 === 0 ? 'living' : 'kitchen';
  const roomOptions = interiors.filter(photo => photo.kind === preferredRoom);
  const room = roomOptions[i % roomOptions.length];
  const further = interiors.filter(photo => photo.path !== room?.path);
  return {
    _id: 'ad13' + (i + 1).toString(16).padStart(20, '0'),
    demoKey: `phase3-rental-${i + 1}`,
    is_demo: true,
    is_featured: ['Cork', 'Galway', 'Dublin'].includes(county) && i < 26,
    name: `${['Bright', 'Spacious', 'Modern', 'Quiet', 'Well-connected'][Math.floor(i / 5) % 5]} ${type === 'House' ? houseFormat : type === 'Apartment' ? (i % 2 ? 'two-bedroom apartment' : 'one-bedroom apartment') : type === 'Cabin Or Cottage' ? 'cottage' : type.toLowerCase()} in ${city}`,
    type,
    description: `Fictional demonstration listing in ${city}, County ${county}. The price and amenities illustrate an example rental. The credited exterior and room photos are independent examples. They do not show a home available for rent.`,
    location: { city, county, town_key: normaliseTown(city) },
    beds: type === 'Studio' ? 0 : type === 'House' ? 3 : type === 'Private Room' ? 1 : 1 + i % 2,
    baths: 1 + (type === 'House' ? i % 2 : 0),
    square_metres: 28 + (i * 11 % 76),
    furnishing: i % 4 === 0 ? 'Unfurnished' : i % 4 === 1 ? 'Part-furnished' : 'Furnished',
    availability: `2027-0${1 + i % 4}-${String(1 + i % 26).padStart(2, '0')}`,
    shared: type === 'Shared Accommodation', student: type === 'Student Accommodation',
    rates: { monthly },
    amenities: i % 2 ? ['Parking', 'Washer & Dryer'] : ['High-Speed Internet', 'Full Kitchen', 'Garden'],
    images: [cover?.path ?? '/rentals/apartment.svg', room?.path, further[(i * 3) % further.length]?.path].filter(Boolean),
    createdAt: new Date(Date.UTC(2026, 10, i + 1)).toISOString(),
  };
});
