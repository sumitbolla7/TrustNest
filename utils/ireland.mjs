export const rentalTypes = ['Apartment', 'House', 'Studio', 'Private Room', 'Short-term Accommodation', 'Shared Accommodation', 'Student Accommodation', 'Cabin Or Cottage', 'Other'];

export function formatRent(amount) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(amount);
}

export function rentalPrice(rates) {
  for (const [period, label] of [['monthly', 'month'], ['weekly', 'week'], ['nightly', 'night']]) {
    if (rates?.[period] > 0) return `${formatRent(rates[period])} / ${label}`;
  }
  return 'Rent on request';
}

export function floorArea(property) {
  return property.square_metres ?? Math.round(property.square_feet * 0.092903);
}

export function normaliseEircode(value) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, '');
  if (!compact) return '';
  if (!/^(?:[AC-FHKNPRTV-Y][0-9]{2}|D6W)[0-9AC-FHKNPRTV-Y]{4}$/.test(compact)) throw new Error('Enter a valid Eircode');
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export function addressParts(location) {
  return [location.street, location.city, location.county ?? location.state, location.eircode ?? location.zipcode].filter(Boolean);
}
