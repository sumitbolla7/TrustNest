import { randomUUID } from 'node:crypto';
import cloudinary from '@/config/cloudinary';
import { sanitiseRentalImage } from '@/utils/rentalImage.mjs';

export async function readPhotos(form, maximum) {
  const files = form.getAll('images').filter(file => file?.name !== '');
  if (files.length > maximum) throw new Error('Keep no more than four photos.');
  return Promise.all(files.map(sanitiseRentalImage));
}

export async function uploadPhotos(photos, uploaded) {
  const images = [];
  for (const bytes of photos) {
    const result = await cloudinary.uploader.upload('data:image/jpeg;base64,' + bytes.toString('base64'), {
      folder: 'trustnest', public_id: randomUUID(), resource_type: 'image', overwrite: false,
    });
    uploaded.push(result.public_id);
    images.push(result.secure_url);
  }
  return images;
}

export function discardUploads(uploaded) {
  return Promise.allSettled(uploaded.map(id => cloudinary.uploader.destroy(id)));
}
