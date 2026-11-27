import Link from 'next/link';

export default function PhotoCredit({ photo, className = '' }) {
  if (!photo) return null;
  const anchor = photo.path.split('/').pop().replace(/\.webp$/, '');
  return <Link href={'/photo-credits#' + anchor} className={'underline ' + className}>Photo: {photo.creator} · {photo.license}</Link>;
}
