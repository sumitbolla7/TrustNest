import sharp from 'sharp';
import { imageMime } from './security.mjs';

export async function sanitiseRentalImage(file) {
  if (typeof file?.arrayBuffer !== 'function' || !file.size || file.size > 1024 * 1024) throw new Error('Invalid image size');
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = imageMime(bytes);
  if (!mime || file.type !== mime) throw new Error('Invalid image signature');
  const image = sharp(bytes, { failOn: 'warning', limitInputPixels: 16_000_000 });
  const metadata = await image.metadata();
  if (metadata.format !== (mime === 'image/jpeg' ? 'jpeg' : 'png') || (metadata.pages ?? 1) > 1) throw new Error('Unsupported image');
  const cleaned = await image.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  return cleaned;
}
