'use client';
import Link from 'next/link';
import { useState } from 'react';
import { contactSchema, type ContactInput } from '@/lib/validation';
const initial: ContactInput = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  website: '',
};
export function ContactForm() {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  function field(name: keyof ContactInput) {
    return {
      id: name,
      name,
      value: data[name],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
      ) => setData({ ...data, [name]: e.target.value }),
      'aria-invalid': !!errors[name],
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
    };
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = contactSchema.safeParse(data);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors(fields);
      requestAnimationFrame(() => document.getElementById(Object.keys(fields)[0])?.focus());
      return;
    }
    setErrors({});
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result.data, kind: 'contact' }),
        signal: AbortSignal.timeout(20000),
      });
      const delivery = await response.json();
      if (!response.ok)
        throw new Error(delivery.error || 'Your inquiry could not be delivered. Please try again.');
      setStatus('success');
      setData(initial);
    } catch (e) {
      setStatus('error');
      setError(
        e instanceof Error
          ? e.message
          : 'Your inquiry could not be delivered. Please contact us by email.',
      );
    }
  }
  const errorFor = (name: string) =>
    errors[name] && (
      <span className="field-error" id={`${name}-error`}>
        {errors[name]?.[0]}
      </span>
    );
  if (status === 'success')
    return (
      <div className="success-state" role="status">
        <span className="eyebrow">Inquiry received</span>
        <h2>Let’s talk about your project.</h2>
        <p>
          Your message has been delivered to Defiant. We’ll reply using the contact information you
          provided.
        </p>
        <button className="button" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  return (
    <form onSubmit={submit} noValidate className="contact-form">
      <div className="form-grid">
        <div>
          <label htmlFor="name">
            Name <span>(required)</span>
          </label>
          <input {...field('name')} autoComplete="name" required />
          {errorFor('name')}
        </div>
        <div>
          <label htmlFor="email">
            Email <span>(required)</span>
          </label>
          <input {...field('email')} type="email" autoComplete="email" required />
          {errorFor('email')}
        </div>
        <div>
          <label htmlFor="phone">
            Phone <span>(optional)</span>
          </label>
          <input {...field('phone')} type="tel" autoComplete="tel" />
          {errorFor('phone')}
        </div>
        <div>
          <label htmlFor="subject">
            Subject <span>(required)</span>
          </label>
          <select {...field('subject')} required>
            <option value="">Choose a subject</option>
            {[
              'Build inquiry',
              'Existing order',
              'Shipping & lead time',
              'Warranty',
              'Product question',
              'Something else',
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {errorFor('subject')}
        </div>
      </div>
      <div>
        <label htmlFor="message">
          Tell us about your project <span>(required)</span>
        </label>
        <textarea {...field('message')} rows={6} maxLength={6000} required />
        {errorFor('message')}
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input {...field('website')} tabIndex={-1} autoComplete="off" />
      </div>
      <p className="form-note">
        Please leave out firearm serial numbers and sensitive personal information. By sending, you
        acknowledge our <Link href="/privacy">privacy policy</Link>.
      </p>
      {status === 'error' && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="button" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending inquiry…' : 'Send inquiry'}
      </button>
    </form>
  );
}
