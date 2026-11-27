'use client';

import dynamic from 'next/dynamic';

const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false, loading: () => <p role='status' className='mt-3 text-sm'>Loading map…</p>,
});
export default PropertyMap;
