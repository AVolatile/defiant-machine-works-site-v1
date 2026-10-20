'use client';
import { usStates, type CheckoutInput } from '@/lib/commerce/schema';
export type CheckoutAddress = Omit<CheckoutInput['address'], 'state'> & { state: string };
export const emptyAddress = (): CheckoutAddress => ({
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
});
export function AddressFields({
  prefix,
  value,
  onChange,
  errors,
}: {
  prefix: 'billing' | 'return';
  value: CheckoutAddress;
  onChange: (value: CheckoutAddress) => void;
  errors: Record<string, string>;
}) {
  const fields = [
    ['line1', 'Street address', 'address-line1'],
    ['line2', 'Apartment / suite (optional)', 'address-line2'],
    ['city', 'City', 'address-level2'],
    ['state', 'State', 'address-level1'],
    ['postalCode', 'ZIP code', 'postal-code'],
  ] as const;
  return (
    <div className="form-grid">
      {fields.map(([name, label, autocomplete]) => {
        const id = `${prefix}-${name}`,
          error = errors[id];
        const props = {
          id,
          value: value[name],
          'aria-invalid': !!error,
          'aria-describedby': error ? `${id}-error` : undefined,
          autoComplete: `section-${prefix} ${prefix === 'billing' ? 'billing' : 'shipping'} ${autocomplete}`,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            onChange({ ...value, [name]: e.target.value }),
        };
        return (
          <div key={id} className={name === 'line1' ? 'full-field' : ''}>
            <label htmlFor={id}>{label}</label>
            {name === 'state' ? (
              <select {...props}>
                <option value="">Choose state</option>
                {usStates.map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            ) : (
              <input
                {...props}
                maxLength={name === 'postalCode' ? 10 : 150}
                inputMode={name === 'postalCode' ? 'numeric' : undefined}
              />
            )}
            {error && (
              <span className="field-error" id={`${id}-error`}>
                {error}
              </span>
            )}
          </div>
        );
      })}
      <div>
        <label htmlFor={`${prefix}-country`}>Country</label>
        <select
          id={`${prefix}-country`}
          value="US"
          onChange={() => {}}
          autoComplete={`section-${prefix} country`}
        >
          <option value="US">United States</option>
        </select>
      </div>
    </div>
  );
}
export function AddressText({ address }: { address: CheckoutAddress }) {
  return (
    <p>
      {address.line1}
      {address.line2 && (
        <>
          <br />
          {address.line2}
        </>
      )}
      <br />
      {address.city}, {address.state} {address.postalCode}
      <br />
      United States
    </p>
  );
}
