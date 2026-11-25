export const objectId = /^[a-f0-9]{24}$/i;

export function literalSearch(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export function sameOrigin(request, canonicalOrigin) {
  if (!canonicalOrigin) return false;
  const origin = request.headers.get('origin');
  return origin === new URL(canonicalOrigin).origin;
}

export function imageMime(bytes) {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return 'image/png';
  if (bytes.length >= 3 && [255, 216, 255].every((value, index) => bytes[index] === value)) return 'image/jpeg';
  return null;
}
