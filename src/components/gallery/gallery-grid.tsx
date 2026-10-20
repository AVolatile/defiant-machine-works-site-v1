'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { galleryServiceFilter } from '@/lib/gallery';
import type { GalleryItem } from '@/data/types';
import { Photo } from '@/components/ui/primitives';
export function GalleryGrid({
  items,
  filters = true,
  limit,
  initialQuery = '',
  initialService = '',
}: {
  items: GalleryItem[];
  filters?: boolean;
  limit?: number;
  initialQuery?: string;
  initialService?: string;
}) {
  const [filter, setFilter] = useState(() => galleryServiceFilter(initialService));
  const [selected, setSelected] = useState<number | null>(null);
  const [finish, setFinish] = useState(initialQuery);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const categories = ['All', ...new Set(items.map((i) => i.service))];
  const filtered = items
    .filter(
      (i) =>
        (filter === 'All' || i.service === filter) &&
        (!finish || `${i.title} ${i.finish}`.toLowerCase().includes(finish.toLowerCase())),
    )
    .slice(0, limit);
  const close = useCallback(() => {
    dialog.current?.close();
    setSelected(null);
    lastFocus.current?.focus();
  }, []);
  useEffect(() => {
    if (selected === null) return;
    const current = dialog.current;
    current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight')
        setSelected((s) => (s === null ? null : (s + 1) % filtered.length));
      if (e.key === 'ArrowLeft')
        setSelected((s) => (s === null ? null : (s - 1 + filtered.length) % filtered.length));
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', key);
    };
  }, [selected, filtered.length]);
  return (
    <>
      {filters && (
        <div className="gallery-controls">
          <div className="filter-bar" aria-label="Gallery categories">
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)} aria-pressed={filter === c}>
                {c}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="finish-search" className="sr-only">
              Search finish names
            </label>
            <input
              id="finish-search"
              type="search"
              placeholder="Find a finish…"
              value={finish}
              onChange={(e) => setFinish(e.target.value)}
            />
          </div>
        </div>
      )}
      {filters && (
        <p className="results-count" aria-live="polite">
          {filtered.length} projects / Actual Defiant work
        </p>
      )}
      {filtered.length ? (
        <div className="gallery-grid">
          {filtered.map((item, i) => (
            <button
              key={item.slug}
              className="gallery-tile"
              onClick={(e) => {
                lastFocus.current = e.currentTarget;
                setSelected(i);
              }}
              aria-label={`Open ${item.title}`}
            >
              <Photo
                src={item.image}
                alt={`${item.title} — Defiant Machine Works ${item.service.toLowerCase()}`}
                sizes="(max-width: 650px) 100vw, 50vw"
              />
              <div className="gallery-caption">
                <span>
                  <small>
                    {item.service}
                    {item.referenceStatus === 'coming-soon' && ' / Coming soon · Reference only'}
                  </small>
                  <strong>{item.title}</strong>
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No matching finishes.</h2>
          <p>Try a different finish name or reset the collection.</p>
          <button
            className="button"
            onClick={() => {
              setFinish('');
              setFilter('All');
            }}
          >
            Reset gallery
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="lightbox"
        aria-labelledby="lightbox-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {selected !== null && filtered[selected] && (
          <div className="lightbox-inner">
            <button className="lightbox-close" aria-label="Close gallery" onClick={close}>
              ✕
            </button>
            <div className="lightbox-image">
              <Image
                src={filtered[selected].image}
                alt={filtered[selected].title}
                fill
                sizes="90vw"
              />
            </div>
            <div className="lightbox-caption">
              <div>
                <span className="eyebrow">{filtered[selected].service}</span>
                <h2 id="lightbox-title">{filtered[selected].title}</h2>
                {filtered[selected].referenceStatus === 'coming-soon' && (
                  <p className="form-note">
                    Coming soon. Visual reference only; not available to order.
                  </p>
                )}
                <Link
                  href={`/custom-inquiry?service=${encodeURIComponent(filtered[selected].service)}&finish=${encodeURIComponent(filtered[selected].finish)}`}
                >
                  {filtered[selected].finish ? 'Inquire about this finish' : 'Ask about this work'}
                </Link>
              </div>
              <div className="lightbox-navigation">
                <button
                  aria-label="Previous project"
                  onClick={() => setSelected((selected - 1 + filtered.length) % filtered.length)}
                >
                  ←
                </button>
                <span aria-live="polite">
                  {selected + 1} / {filtered.length}
                </span>
                <button
                  aria-label="Next project"
                  onClick={() => setSelected((selected + 1) % filtered.length)}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
