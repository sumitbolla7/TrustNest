import { counties, normaliseTown } from '../utils/marketplace.mjs';

const towns = [
  'Carlow', 'Cavan', 'Ennis', 'Cork', 'Letterkenny', 'Dublin', 'Galway', 'Tralee',
  'Naas', 'Kilkenny', 'Portlaoise', 'Carrick-on-Shannon', 'Limerick', 'Longford', 'Dundalk',
  'Castlebar', 'Navan', 'Monaghan', 'Tullamore', 'Roscommon', 'Sligo', 'Clonmel',
  'Waterford', 'Athlone', 'Wexford', 'Bray',
];
const locations = counties.map((county, i) => [county, towns[i]]).concat([
  ['Dublin', 'Dún Laoghaire'], ['Cork', 'Cobh'], ['Galway', 'Oranmore'], ['Limerick', 'Castletroy'],
]);
const types = ['Apartment', 'House', 'Studio', 'Shared Accommodation', 'Student Accommodation'];
export const demoListings = locations.map(([county, city], i) => {
  const type = types[i % types.length];
  const monthly = (type.includes('Accommodation') ? 560 : 970) + (i * 139) % (type.includes('Accommodation') ? 440 : 980) + (county === 'Dublin' ? 350 : 0);
  const variant = type === 'House' ? 'house' : type.includes('Accommodation') ? 'shared' : 'apartment';
  return {
    _id: 'ad13' + (i + 1).toString(16).padStart(20, '0'),
    demoKey: `phase3-rental-${i + 1}`,
    is_demo: true,
    is_featured: ['Cork', 'Galway', 'Dublin'].includes(county) && i < 26,
    name: `${['Bright', 'Spacious', 'Modern', 'Quiet', 'Well-connected'][Math.floor(i / 5) % 5]} ${type.toLowerCase()} in ${city}`,
    type,
    description: `Fictional demonstration listing in ${city}, County ${county}. Explore an example of a ${type.toLowerCase()} with monthly rent and typical amenities. This property is unavailable for real enquiries or viewings.`,
    location: { city, county, town_key: normaliseTown(city) },
    beds: type === 'Studio' ? 0 : type === 'House' ? 3 : 1 + i % 2,
    baths: 1 + (type === 'House' ? i % 2 : 0),
    square_metres: 28 + (i * 11 % 76),
    furnishing: i % 4 === 0 ? 'Unfurnished' : i % 4 === 1 ? 'Part-furnished' : 'Furnished',
    availability: `2027-0${1 + i % 4}-${String(1 + i % 26).padStart(2, '0')}`,
    shared: type === 'Shared Accommodation', student: type === 'Student Accommodation',
    rates: { monthly },
    amenities: i % 2 ? ['Parking', 'Washer & Dryer'] : ['High-Speed Internet', 'Full Kitchen', 'Garden'],
    images: [`/rentals/${variant}.svg`],
    createdAt: new Date(Date.UTC(2026, 10, i + 1)).toISOString(),
  };
});
