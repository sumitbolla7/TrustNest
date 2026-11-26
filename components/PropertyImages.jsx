'use client';
import Image from 'next/image';
import { Gallery, Item } from 'react-photoswipe-gallery';

export default function PropertyImages({ images }) {
  return (
    <Gallery>
      <div className='grid grid-cols-2 gap-3'>
        {images.map((image, index) => (
          <Item key={`${image}-${index}`} original={image} thumbnail={image} width={1000} height={600}>
            {({ ref, open }) => (
              <button ref={ref} type='button' onClick={open} aria-label={`Open rental image ${index + 1}`}
                className={`relative overflow-hidden rounded-xl bg-emerald-50 ${index === 0 ? 'col-span-2 aspect-[5/3]' : 'aspect-[5/3]'}`}>
                <Image src={image} alt='' fill sizes='(min-width: 1024px) 60vw, 100vw' className='object-cover' />
              </button>
            )}
          </Item>
        ))}
      </div>
    </Gallery>
  );
}
