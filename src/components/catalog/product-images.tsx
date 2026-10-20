'use client';
import { useState } from 'react';
import { Photo } from '@/components/ui/primitives';
export function ProductImages({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  return (
    <div className="product-images">
      <Photo src={images[index]} alt={`${title} — view ${index + 1}`} priority />
      {images.length > 1 && (
        <div className="image-thumbnails">
          {images.map((image, i) => (
            <button
              key={image}
              aria-label={`View image ${i + 1} of ${title}`}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
            >
              <img src={image} alt="" width="80" height="80" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
