'use client';

import Image from 'next/image';
import { useState } from 'react';

const fallback = '/rentals/apartment.svg';

export default function PropertyImage({ src, alt, ...props }) {
  const [failed, setFailed] = useState(null);
  const display = src && failed !== src ? src : fallback;
  return <Image {...props} src={display} alt={display === fallback && alt ? 'Rental illustration' : alt}
    onError={() => { if (display !== fallback) setFailed(src); }} />;
}
