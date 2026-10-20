'use client';
import { useState } from 'react';
import type { CatalogField } from '@/lib/commerce/catalog-schema';
import { OptionCard } from './option-card';
import { money } from '@/lib/commerce/schema';
export function OptionPicker({
  field,
  value,
  onChange,
  serviceId,
  error,
}: {
  field: CatalogField;
  value: string;
  onChange: (value: string) => void;
  serviceId: string;
  error?: string;
}) {
  const [query, setQuery] = useState(''),
    [all, setAll] = useState(false);
  const filtered = field.options.filter((o) =>
    o.displayName.toLowerCase().includes(query.toLowerCase()),
  );
  const visible = query || all ? filtered : filtered.filter((o, i) => i < 6 || o.id === value);
  return (
    <fieldset
      className="option-picker"
      id={`${serviceId}-${field.id}`}
      aria-describedby={error ? `${serviceId}-${field.id}-error` : undefined}
    >
      <legend>
        {field.displayName}
        {field.required && <span aria-hidden="true"> *</span>}
      </legend>
      {field.options.length > 7 && (
        <div className="option-search">
          <label htmlFor={`${serviceId}-${field.id}-search`}>
            Find a {field.role === 'texture' ? 'texture' : 'finish'}
          </label>
          <input
            id={`${serviceId}-${field.id}-search`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search available choices"
          />
        </div>
      )}
      <div className="option-choice-grid">
        {visible.map((option) => (
          <OptionCard
            key={option.id}
            type="radio"
            title={option.displayName}
            value={option.id}
            name={`${serviceId}-${field.id}`}
            checked={value === option.id}
            required={field.required}
            describedBy={error ? `${serviceId}-${field.id}-error` : undefined}
            accessibleName={`${option.displayName}${option.deltaCents ? ` / ${money(option.deltaCents)}` : ' / included'}`}
            onChange={() => onChange(option.id)}
            price={
              option.deltaCents
                ? `${option.deltaCents > 0 ? '+' : ''}${money(option.deltaCents)}`
                : 'Included'
            }
            description={
              option.reference?.aggression != null
                ? `Aggression ${option.reference.aggression} / 10`
                : undefined
            }
            context={option.reference?.aggression != null ? option.reference.context : undefined}
          />
        ))}
      </div>
      {error && (
        <p className="field-error" id={`${serviceId}-${field.id}-error`}>
          {error}
        </p>
      )}
      {!visible.length && <p className="form-note">No matching choices. Try another name.</p>}
      {!query && field.options.length > 6 && (
        <button type="button" className="text-link" onClick={() => setAll(!all)}>
          {all ? 'Show fewer choices' : `Show all ${field.options.length} choices`}
        </button>
      )}
    </fieldset>
  );
}
