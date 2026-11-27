import photos from './propertyPhotos.json' with { type: 'json' };

export { photos };
export const photoByPath = new Map(photos.map(photo => [photo.path, photo]));
export const photoGroup = group => photos.filter(photo => photo.group === group);
export const photoModifications = 'Auto-oriented, resized where needed, and converted to WebP; embedded metadata removed. Display crops may vary by screen.';
