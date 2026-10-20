'use client';
import { useMemo, useState } from 'react';
import type { Product } from '@/data/types';
import { ProductCard } from './product-card';
export function ProductBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const categories = ['All', ...new Set(products.map((p) => p.category))];
  const filtered = useMemo(() => {
    const result = products.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        `${p.title} ${p.category}`.toLowerCase().includes(query.toLowerCase().trim()),
    );
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [products, query, category, sort]);
  return (
    <>
      <div className="catalog-controls">
        <div className="search-field">
          <label htmlFor="product-search">Search the catalog</label>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, services, options…"
          />
        </div>
        <div>
          <label htmlFor="product-sort">Sort by</label>
          <select id="product-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="name">Name: A–Z</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>
      <div className="filter-bar" aria-label="Product categories">
        {categories.map((c) => (
          <button
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            key={c}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="results-count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        {category !== 'All' && ` / ${category}`}
      </p>
      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard product={p} key={p.slug} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No matching work or products.</h2>
          <p>Try a broader search, or clear your filters to see the full catalog.</p>
          <button
            className="button"
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
