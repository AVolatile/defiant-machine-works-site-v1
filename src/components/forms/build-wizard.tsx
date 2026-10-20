'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { buildSchema, buildDraftSchema, buildServices, type BuildInput } from '@/lib/validation';
import { textures } from '@/data/services';
const steps = [
  'Your project',
  'Platform',
  'Model',
  'Options',
  'Finish & reference',
  'Your details',
  'Review',
];
const services = buildServices;
const platforms: Record<string, string[]> = {
  Stippling: [
    'Glock',
    'SIG Sauer',
    'Smith & Wesson',
    'CZ',
    'Springfield Armory',
    'FN',
    'Ruger',
    'Staccato',
    'OA Defense',
    'Beretta',
    'PSA',
  ],
  'Slide Milling': ['Glock', 'SIG Sauer', 'Smith & Wesson', 'CZ'],
  Cerakote: [
    'Glock',
    'SIG Sauer',
    'Smith & Wesson',
    'CZ',
    'Springfield Armory',
    'Other / ask Defiant',
  ],
  Porting: ['Smith & Wesson'],
  'Product Question': ['Not applicable'],
  'Full Custom Project': ['Glock', 'SIG Sauer', 'Smith & Wesson', 'CZ', 'Other / ask Defiant'],
};
const models: Record<string, string[]> = {
  Glock: [],
  'SIG Sauer': ['P365'],
  'Smith & Wesson': ['Bodyguard 2.0', 'M&P 2.0'],
  CZ: ['P-10 C', 'P-07', '75 Series'],
  'Springfield Armory': ['Echelon', 'Prodigy'],
  FN: ['Reflex'],
  Ruger: ['RXM'],
  Staccato: ['2011'],
  'OA Defense': ['2311'],
  Beretta: ['PX4'],
  PSA: ['Dagger'],
};
const optionsFor = (service: string, manufacturer: string) =>
  service === 'Stippling'
    ? textures.map((t) => t.name)
    : service === 'Slide Milling'
      ? manufacturer === 'Glock'
        ? ['Optic cut', 'Genesis OEM Slide Mill', 'Saber OEM Slide Mill']
        : manufacturer === 'SIG Sauer'
          ? ['Optic cut', 'The Tiger Shark']
          : ['Optic cut']
      : service === 'Cerakote'
        ? ['Complete pistol', 'Frame only', 'Slide only', 'Custom camouflage']
        : service === 'Porting'
          ? ['Bodyguard 2.0 Viper Ports']
          : ['Discuss with Defiant'];
const key = 'dmw-build-draft-v1';
export function BuildWizard({
  product = '',
  service = '',
  finish = '',
}: {
  product?: string;
  service?: string;
  finish?: string;
}) {
  const initial: BuildInput = {
    service: services.some((s) => s === service)
      ? (service as BuildInput['service'])
      : product
        ? 'Product Question'
        : '',
    manufacturer: '',
    model: '',
    options: [],
    finish,
    notes: '',
    reference: '',
    name: '',
    email: '',
    phone: '',
    preferred: 'Email',
    acknowledgement: false,
    product,
  };
  const [data, setData] = useState(initial);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const skipDraftSave = useRef(false);
  const [draftNotice, setDraftNotice] = useState('');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved && !product && !service && !finish) {
        const parsed = buildDraftSchema.safeParse(JSON.parse(saved));
        if (parsed.success)
          queueMicrotask(() => {
            const {
              name: _name,
              email: _email,
              phone: _phone,
              notes: _notes,
              reference: _reference,
              ...nonPersonal
            } = parsed.data;
            void _name;
            void _email;
            void _phone;
            void _notes;
            void _reference;
            setData((d) => ({ ...d, ...nonPersonal, acknowledgement: false }));
            setDraftNotice('Your unfinished inquiry has been restored.');
          });
      }
    } catch {}
    queueMicrotask(() => setReady(true));
  }, [product, service, finish]);
  useEffect(() => {
    if (skipDraftSave.current) {
      skipDraftSave.current = false;
      return;
    }
    const meaningful =
      data.service ||
      data.model ||
      data.name ||
      data.email ||
      data.notes ||
      data.finish ||
      data.product;
    if (ready && meaningful && status !== 'success')
      try {
        const {
          name: _name,
          email: _email,
          phone: _phone,
          notes: _notes,
          reference: _reference,
          ...nonPersonal
        } = data;
        void _name;
        void _email;
        void _phone;
        void _notes;
        void _reference;
        localStorage.setItem(key, JSON.stringify(nonPersonal));
      } catch {}
  }, [data, ready, status]);
  function update<K extends keyof BuildInput>(field: K, value: BuildInput[K]) {
    setData((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }
  function validate() {
    const parsed = buildSchema.safeParse(data);
    const all = parsed.success
      ? {}
      : (parsed.error.flatten().fieldErrors as Record<string, string[]>);
    const required = [
      ['service'],
      ['manufacturer'],
      ['model'],
      [],
      ['reference'],
      ['name', 'email', 'phone', 'preferred'],
      ['acknowledgement'],
    ][step];
    const current: Record<string, string[] | undefined> = {};
    for (const field of required) if (all[field]) current[field] = all[field];
    if (step === 5 && data.preferred === 'Phone' && !data.phone)
      current.phone = ['Enter a phone number so we can call you.'];
    setErrors(current);
    if (Object.keys(current).length) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return false;
    }
    return true;
  }
  function move(next: number) {
    if (next > step && !validate()) return;
    setStep(next);
    setErrors({});
    requestAnimationFrame(() => {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function reset() {
    skipDraftSave.current = true;
    setData(initial);
    setStep(0);
    setStatus('idle');
    setErrors({});
    setDraftNotice('Draft cleared.');
    try {
      localStorage.removeItem(key);
    } catch {}
  }
  async function submit() {
    if (!validate()) return;
    const parsed = buildSchema.safeParse(data);
    if (!parsed.success) {
      setMessage(
        'Some details need attention. Use Back to check your project and contact information.',
      );
      setStatus('error');
      return;
    }
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, kind: 'build', website: '' }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setStatus('success');
      localStorage.removeItem(key);
    } catch (e) {
      setStatus('error');
      setMessage(
        e instanceof Error
          ? e.message
          : 'Your inquiry could not be sent. Please contact Defiant directly.',
      );
    }
  }
  const props = (field: keyof BuildInput) => ({
    id: `build-${field}`,
    'aria-invalid': !!errors[field],
    'aria-describedby': errors[field] ? `error-${field}` : undefined,
  });
  const error = (field: keyof BuildInput) =>
    errors[field] && (
      <span id={`error-${field}`} className="field-error">
        {errors[field]?.[0]}
      </span>
    );
  if (status === 'success')
    return (
      <section className="wizard success-state" role="status">
        <span className="eyebrow">Custom inquiry delivered</span>
        <h2>Your project starts here.</h2>
        <p>
          Defiant has received your inquiry. We’ll contact you to confirm compatibility, final
          pricing, and shipping instructions. Please wait for those instructions before sending
          anything.
        </p>
        <button className="button" onClick={reset}>
          Start another inquiry
        </button>
      </section>
    );
  return (
    <div className="wizard-layout">
      <aside className="wizard-sidebar">
        <span className="eyebrow">Custom inquiry</span>
        <ol>
          {steps.map((label, i) => (
            <li key={label} aria-current={step === i ? 'step' : undefined}>
              <span>{i < step ? '✓' : String(i + 1).padStart(2, '0')}</span>
              {label}
            </li>
          ))}
        </ol>
        <p>
          No payment required.
          <br />
          Every detail confirmed with you.
        </p>
        <button className="text-link" onClick={reset}>
          Clear saved draft
        </button>
      </aside>
      <section className="wizard">
        <div className="wizard-progress">
          <span className="eyebrow">Step {String(step + 1).padStart(2, '0')} / 07</span>
          <span>{Math.round(((step + 1) / 7) * 100)}%</span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${((step + 1) / 7) * 100}%` }} />
        </div>
        {draftNotice && (
          <p className="form-note" role="status">
            {draftNotice}
          </p>
        )}
        <h2 ref={heading} tabIndex={-1}>
          {
            [
              'What do you have in mind?',
              'Choose your platform.',
              'Tell us your model.',
              'Make it your own.',
              'The finishing touches.',
              'Let’s stay in touch.',
              'Your vision, on paper.',
            ][step]
          }
        </h2>
        {data.product && (
          <p className="selected-product">
            <span className="eyebrow">Selected from catalog</span>
            {data.product}
          </p>
        )}
        {step === 0 && (
          <>
            <p>Choose a starting point. We’ll help you work out the details.</p>
            <div className="choice-grid" role="group" aria-label="Service">
              {services.map((s, i) => (
                <button
                  key={s}
                  {...(i === 0 ? props('service') : {})}
                  aria-pressed={data.service === s}
                  className="choice"
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      service: s as BuildInput['service'],
                      manufacturer: '',
                      model: '',
                      options: [],
                    }))
                  }
                >
                  <span className="mono">0{i + 1}</span>
                  <strong>{s}</strong>
                  <span aria-hidden="true">{data.service === s ? '✓' : ''}</span>
                </button>
              ))}
            </div>
            {error('service')}
          </>
        )}
        {step === 1 && (
          <>
            <label htmlFor="build-manufacturer">Manufacturer / platform</label>
            <select
              {...props('manufacturer')}
              value={data.manufacturer}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  manufacturer: e.target.value,
                  model: e.target.value === 'Not applicable' ? 'Not applicable' : '',
                }))
              }
            >
              <option value="">Select your platform</option>
              {(platforms[data.service] || platforms['Full Custom Project']).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            {error('manufacturer')}
            {data.service === 'Porting' && (
              <p className="notice">
                Bodyguard 2.0 Viper Ports is the currently listed option. For platforms marked
                “Coming Soon,” contact Defiant to discuss availability.
              </p>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <label htmlFor="build-model">Model</label>
            <input
              {...props('model')}
              list="model-suggestions"
              value={data.model}
              maxLength={100}
              onChange={(e) => update('model', e.target.value)}
              placeholder="Include model and generation, if known"
            />
            <datalist id="model-suggestions">
              {(models[data.manufacturer] || []).map((m) => (
                <option key={m}>{m}</option>
              ))}
            </datalist>
            {error('model')}
            <p className="form-note">
              Model suggestions reflect listed platforms. Defiant will confirm compatibility before
              work begins.
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <p>
              Select the options you’d like to discuss, or continue and let us guide you. Fitment is
              confirmed individually.
            </p>
            <div className="checkbox-options">
              {optionsFor(data.service, data.manufacturer).map((o) => (
                <label key={o}>
                  <input
                    type="checkbox"
                    checked={data.options.includes(o)}
                    onChange={(e) =>
                      update(
                        'options',
                        e.target.checked
                          ? [...data.options, o]
                          : data.options.filter((v) => v !== o),
                      )
                    }
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
            {data.service === 'Stippling' && (
              <Link className="text-link" href="/resources/stippling-guide" target="_blank">
                Compare texture ratings (opens new tab)
              </Link>
            )}
          </>
        )}
        {step === 4 && (
          <>
            <label htmlFor="build-finish">
              Finish or color <span>(optional)</span>
            </label>
            <input
              {...props('finish')}
              value={data.finish}
              onChange={(e) => update('finish', e.target.value)}
              maxLength={150}
              placeholder="e.g. Midnight Bronze H-294"
            />
            <label htmlFor="build-reference">
              Reference URL <span>(optional)</span>
            </label>
            <input
              {...props('reference')}
              type="url"
              value={data.reference}
              onChange={(e) => update('reference', e.target.value)}
              placeholder="https://"
            />
            {error('reference')}
            <label htmlFor="build-notes">
              Project notes <span>(optional)</span>
            </label>
            <textarea
              {...props('notes')}
              rows={4}
              maxLength={3000}
              value={data.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Your goals, questions, or other details we should know."
            />
            <p className="form-note">
              Please leave out firearm serial numbers. You can share reference photos with Defiant
              by email.
            </p>
          </>
        )}
        {step === 5 && (
          <div className="form-grid">
            {(['name', 'email', 'phone'] as const).map((f) => (
              <div key={f}>
                <label htmlFor={`build-${f}`}>
                  {f === 'name'
                    ? 'Name'
                    : f === 'email'
                      ? 'Email'
                      : 'Phone (optional unless preferred)'}
                </label>
                <input
                  {...props(f)}
                  type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
                  autoComplete={f === 'phone' ? 'tel' : f}
                  value={data[f]}
                  onChange={(e) => update(f, e.target.value)}
                />
                {error(f)}
              </div>
            ))}
            <div>
              <label htmlFor="build-preferred">Preferred contact method</label>
              <select
                {...props('preferred')}
                value={data.preferred}
                onChange={(e) => update('preferred', e.target.value as 'Email' | 'Phone')}
              >
                <option>Email</option>
                <option>Phone</option>
              </select>
            </div>
          </div>
        )}
        {step === 6 && (
          <>
            <dl className="review-summary">
              {Object.entries({
                Service: data.service,
                Platform: data.manufacturer,
                Model: data.model,
                Options: data.options.join(', ') || 'Discuss with Defiant',
                Finish: data.finish || 'To be confirmed',
                Reference: data.reference || 'None',
                Notes: data.notes || 'None',
                Name: data.name,
                Email: data.email,
                Phone: data.phone || 'Not supplied',
                'Contact preference': data.preferred,
              }).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <label className="acknowledgement">
              <input
                {...props('acknowledgement')}
                type="checkbox"
                checked={data.acknowledgement}
                onChange={(e) => update('acknowledgement', e.target.checked)}
              />
              <span>
                I understand this is an inquiry. Defiant will confirm compatibility, pricing,
                availability, and shipping instructions before work begins.
              </span>
            </label>
            {error('acknowledgement')}
            <p className="form-note">
              Review our <Link href="/privacy">privacy policy</Link>. Only platform and option
              selections are saved in this browser. Contact details, notes, and reference links stay
              in memory.
            </p>
          </>
        )}
        {status === 'error' && (
          <div className="form-error" role="alert">
            {message}
          </div>
        )}
        <div className="wizard-actions">
          <button
            className="button button-secondary"
            onClick={() => move(step - 1)}
            disabled={step === 0 || status === 'sending'}
          >
            ← Back
          </button>
          {step < 6 ? (
            <button className="button" onClick={() => move(step + 1)}>
              Continue
            </button>
          ) : (
            <button className="button" disabled={status === 'sending'} onClick={submit}>
              {status === 'sending' ? 'Sending inquiry…' : 'Send project request'}{' '}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
