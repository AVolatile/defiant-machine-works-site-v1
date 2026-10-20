'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  componentLabels,
  eligibleService,
  familyLabels,
  platforms,
  platformTitle,
  serviceById,
  serviceCatalog,
  serviceMatrix,
  serviceOptions,
  variantLabel,
  variantsFor,
} from '@/lib/commerce/catalog';
import { priceBuild } from '@/lib/commerce/pricing';
import { normalizeBuild, toggleBuildService } from '@/lib/commerce/build-rules';
import { money, type BuildConfiguration, type ServiceSelection } from '@/lib/commerce/schema';
import type { ServiceFamily } from '@/lib/commerce/catalog-schema';
import { cartActions, useCart } from './cart-store';
import { BuildSummary, ServiceDetails } from './build-summary';
import { GalleryReference } from './gallery-reference';
import { OptionCard } from './option-card';
import { ServiceFields } from './service-fields';
import { CoatingConfigurator } from './coating-configurator';
import { isStandaloneCoatingId } from '@/lib/commerce/coating-context';
import { useConfiguratorStepFocus } from './use-configurator-step-focus';
const steps = ['Platform', 'Services', 'Service details', 'Review'];
const blank = (): BuildConfiguration => ({
  schemaVersion: 3,
  id: '00000000-0000-4000-8000-000000000000',
  firearm: {
    manufacturerId: '',
    modelId: '',
    variantId: '',
    generationId: 'unspecified',
    componentType: 'complete-firearm',
  },
  services: [],
  createdAt: '2000-01-01T00:00:00.000Z',
});
type ConfiguratorProps = { editId?: string; product?: string; service?: string };

export function Configurator(props: ConfiguratorProps) {
  const cart = useCart();
  const saved = cart.items.find((item) => item.kind === 'build' && item.id === props.editId);
  const entry =
    serviceById.get(props.product || '') ||
    serviceCatalog.find((entry) => entry.displayName === props.product);
  const coatingEdit =
    saved?.kind === 'build' &&
    saved.build.services.length === 1 &&
    isStandaloneCoatingId(saved.build.services[0].serviceId);
  if (!cart.ready) return <p role="status">Loading your configuration…</p>;
  if (
    coatingEdit ||
    (!props.editId &&
      (props.service?.toLowerCase() === 'cerakote' ||
        (entry && isStandaloneCoatingId(entry.serviceId))))
  )
    return (
      <CoatingConfigurator
        key={props.editId || entry?.serviceId || 'cerakote'}
        initialBuild={coatingEdit && saved.kind === 'build' ? saved.build : undefined}
        product={entry?.serviceId}
      />
    );
  return <PlatformConfigurator {...props} />;
}

function PlatformConfigurator({
  editId = '',
  product = '',
  service = '',
}: {
  editId?: string;
  product?: string;
  service?: string;
}) {
  const cart = useCart(),
    router = useRouter();
  const [build, setBuild] = useState<BuildConfiguration>(blank),
    [step, setStep] = useState(0),
    [errors, setErrors] = useState<string[]>([]),
    [messages, setMessages] = useState<string[]>([]),
    [initialized, setInitialized] = useState(false),
    [activeService, setActiveService] = useState('');
  const { heading, panel } = useConfiguratorStepFocus(step);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cart.ready || initialized) return;
    const saved = cart.items.find((i) => i.kind === 'build' && i.id === editId);
    const entry = serviceById.get(product) || serviceCatalog.find((s) => s.displayName === product);
    queueMicrotask(() => {
      if (saved?.kind === 'build') {
        setBuild(structuredClone(saved.build));
        setActiveService(saved.build.services[0]?.serviceId || '');
      } else {
        const next = blank();
        next.id = crypto.randomUUID();
        next.createdAt = new Date().toISOString();
        if (entry) {
          next.services = [{ serviceId: entry.serviceId, optionIds: [], attributes: {} }];
          next.firearm.manufacturerId =
            entry.compatibleManufacturers.length === 1 ? entry.compatibleManufacturers[0] : '';
          next.firearm.modelId =
            entry.compatibleModels.length === 1 ? entry.compatibleModels[0] : '';
          next.firearm.componentType = entry.componentScope;
          setActiveService(entry.serviceId);
        }
        setBuild(next);
      }
      setInitialized(true);
    });
  }, [cart.ready, cart.items, editId, product, initialized]);
  const priced = useMemo(() => priceBuild(build), [build]);
  const platform = platforms.find((p) => p.id === build.firearm.manufacturerId),
    available = serviceCatalog.filter((s) => eligibleService(s, build.firearm));
  const selected = build.services.find((s) => s.serviceId === activeService) || build.services[0];
  function apply(next: BuildConfiguration) {
    const result = normalizeBuild(next);
    setBuild(result.build);
    setMessages(result.adjustments.map((a) => a.message));
    setErrors([]);
  }
  function firearm<K extends keyof BuildConfiguration['firearm']>(
    key: K,
    value: BuildConfiguration['firearm'][K],
  ) {
    setBuild((b) => ({
      ...b,
      firearm: {
        ...b.firearm,
        [key]: value,
        ...(key === 'manufacturerId'
          ? { modelId: '', variantId: '', generationId: 'unspecified' as const }
          : {}),
        ...(key === 'modelId' ? { variantId: '' } : {}),
      },
    }));
    setErrors([]);
  }
  function toggle(id: string) {
    const entry = serviceById.get(id)!;
    const previous = build.services.filter(
      (c) => serviceById.get(c.serviceId)?.serviceFamily === entry.serviceFamily,
    );
    const result = toggleBuildService(build, entry);
    setBuild(result.build);
    setActiveService(id);
    setMessages([
      ...result.adjustments.map((a) => a.message),
      ...(previous.length &&
      !previous.some((c) => c.serviceId === id) &&
      entry.serviceFamily !== 'cerakote' &&
      entry.componentScope !== 'extension'
        ? [
            `Your previous ${familyLabels[entry.serviceFamily].toLowerCase()} package was replaced. Review the new package details.`,
          ]
        : []),
    ]);
    setErrors([]);
  }
  function select(updated: ServiceSelection) {
    apply({
      ...build,
      services: build.services.map((c) => (c.serviceId === updated.serviceId ? updated : c)),
    });
  }
  function next() {
    let problems: string[] = [];
    if (step === 0) {
      if (!platform) problems.push('Choose a manufacturer.');
      if (!platform?.models.some((m) => m.id === build.firearm.modelId))
        problems.push('Choose a listed model.');
      if (
        !variantsFor(build.firearm.manufacturerId, build.firearm.modelId).some(
          (v) => v.id === build.firearm.variantId,
        )
      )
        problems.push('Choose the variant that matches your project.');
    } else if (step === 1) {
      if (!build.services.length) problems.push('Choose at least one service.');
      for (const choice of build.services)
        if (!available.some((s) => s.serviceId === choice.serviceId))
          problems.push(
            'A selected service does not match your platform, variant or component. Remove it before continuing.',
          );
    } else if (step === 2) problems = priced.errors;
    if (problems.length) {
      setErrors(problems);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setErrors([]);
    setStep((s) => s + 1);
  }
  function save() {
    if (priced.errors.length) {
      setErrors(priced.errors);
      return;
    }
    try {
      cartActions.saveBuild(normalizeBuild(build).build);
      router.push('/cart');
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'Your build could not be saved.']);
    }
  }
  return (
    <>
      <div className="commerce-top-note">
        <span className="review-label">Configure your service order</span>
        <p>Choose the work. See the finish. Pay for each scope once.</p>
        <Link href="/custom-inquiry">Custom project? Request a quote</Link>
      </div>
      <ol className="commerce-progress" aria-label="Configuration progress">
        {steps.map((label, index) => (
          <li key={label} aria-current={step === index ? 'step' : undefined}>
            <span>{index < step ? '✓' : String(index + 1).padStart(2, '0')}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="commerce-layout">
        <section className="configuration-panel" ref={panel}>
          <span className="eyebrow">
            {editId ? 'Edit build' : 'Configure your work'} / 0{step + 1}
          </span>
          <h2 tabIndex={-1} ref={heading}>
            {
              [
                'Choose your platform.',
                'Choose the work.',
                'Make it your own.',
                'Review your build.',
              ][step]
            }
          </h2>
          {!!errors.length && (
            <div ref={errorRef} tabIndex={-1} className="form-error" role="alert">
              <strong>Check your configuration.</strong>
              <ul>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {!!messages.length && (
            <div className="normalization-notice notice" role="status" aria-live="polite">
              <span className="eyebrow">Build updated</span>
              {messages.map((m, i) => (
                <p key={`${i}-${m}`}>{m}</p>
              ))}
            </div>
          )}
          {step === 0 && (
            <>
              {!editId && !build.services.length && (
                <p className="notice">
                  <Link className="text-link" href="/customize?service=cerakote">
                    Cerakote only? Choose scope and finish
                  </Link>
                </p>
              )}
              <div className="form-grid">
                <div>
                  <label htmlFor="manufacturer">Manufacturer</label>
                  <select
                    id="manufacturer"
                    value={build.firearm.manufacturerId}
                    onChange={(e) => firearm('manufacturerId', e.target.value)}
                  >
                    <option value="">Select manufacturer</option>
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="model">Model</label>
                  <select
                    id="model"
                    disabled={!platform}
                    value={build.firearm.modelId}
                    onChange={(e) => firearm('modelId', e.target.value)}
                  >
                    <option value="">Select model</option>
                    {platform?.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="variant">Variant / existing work</label>
                  <select
                    id="variant"
                    disabled={!platform}
                    value={build.firearm.variantId}
                    onChange={(e) => firearm('variantId', e.target.value)}
                  >
                    <option value="">Select variant</option>
                    {variantsFor(build.firearm.manufacturerId, build.firearm.modelId).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="component">Component being sent</label>
                  <select
                    id="component"
                    value={build.firearm.componentType}
                    onChange={(e) =>
                      firearm(
                        'componentType',
                        e.target.value as BuildConfiguration['firearm']['componentType'],
                      )
                    }
                  >
                    {Object.entries(componentLabels).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {platform?.id === 'glock' && (
                  <div>
                    <label htmlFor="generation">Generation group</label>
                    <select
                      id="generation"
                      value={build.firearm.generationId}
                      onChange={(e) =>
                        firearm(
                          'generationId',
                          e.target.value as BuildConfiguration['firearm']['generationId'],
                        )
                      }
                    >
                      <option value="unspecified">
                        Not specified / no generation-specific treatment
                      </option>
                      <option value="gen-3-or-earlier">Gen 3 or earlier</option>
                      <option value="gen-4-or-later">Gen 4 or later</option>
                    </select>
                  </div>
                )}
              </div>
              <p className="form-note">
                An unlisted platform, ambiguous existing modification or custom finish belongs in a{' '}
                <Link href="/custom-inquiry">custom inquiry</Link>.
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <p className="form-note">
                Open a service family to see packages for your platform and component. Multiple
                compatible families stay together as one build.
                {service && ` You arrived from ${service}.`}
              </p>
              {(Object.keys(familyLabels) as ServiceFamily[]).map((family) => {
                const entries = available.filter((s) => s.serviceFamily === family);
                const current = build.services.some(
                  (c) => serviceById.get(c.serviceId)?.serviceFamily === family,
                );
                const upcoming =
                  family === 'porting'
                    ? serviceMatrix.upcoming.filter((entry) =>
                        entry.compatibleManufacturers.includes(build.firearm.manufacturerId),
                      )
                    : [];
                if (!entries.length && !upcoming.length) return null;
                return (
                  <details
                    className="service-family"
                    key={`${family}-${step}`}
                    open={current || undefined}
                  >
                    <summary>
                      {familyLabels[family]}
                      <span>
                        {entries.length
                          ? `${entries.length} available`
                          : 'Coming soon / custom inquiry'}
                      </span>
                    </summary>
                    <GalleryReference family={family} />
                    <div className="service-package-grid">
                      {entries.map((entry) => (
                        <OptionCard
                          className="service-package"
                          key={entry.serviceId}
                          type="checkbox"
                          value={entry.serviceId}
                          title={entry.displayName}
                          checked={build.services.some((c) => c.serviceId === entry.serviceId)}
                          onChange={() => toggle(entry.serviceId)}
                          description={
                            entry.componentScope === 'extension'
                              ? 'Magazine-extension texture'
                              : entry.includedFeatures.map((f) => f.label).join(' · ') ||
                                `${componentLabels[entry.componentScope]} service`
                          }
                          price={`From ${money(entry.basePriceCents)}`}
                          status={
                            entry.checkoutEligibility === 'review-required'
                              ? 'Requires review'
                              : undefined
                          }
                        />
                      ))}
                    </div>
                    {upcoming.length > 0 && (
                      <details className="upcoming-config">
                        <summary>Upcoming porting · not available to order</summary>
                        {upcoming.map((entry) => (
                          <div className="unavailable-package" key={entry.serviceId}>
                            <OptionCard
                              type="checkbox"
                              title={entry.displayName}
                              value={entry.serviceId}
                              checked={false}
                              disabled
                              status="Coming soon"
                            />
                          </div>
                        ))}
                      </details>
                    )}
                  </details>
                );
              })}
              {build.services.some((c) => !available.some((s) => s.serviceId === c.serviceId)) && (
                <div className="notice">
                  <p>A previous selection is unavailable for this component.</p>
                  <button
                    className="text-link"
                    onClick={() =>
                      apply({
                        ...build,
                        services: build.services.filter((c) =>
                          available.some((s) => s.serviceId === c.serviceId),
                        ),
                      })
                    }
                  >
                    Remove incompatible selections
                  </button>
                </div>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <div className="service-detail-tabs" aria-label="Selected service details">
                {build.services.map((choice) => (
                  <button
                    key={choice.serviceId}
                    className="text-link"
                    aria-pressed={selected?.serviceId === choice.serviceId}
                    onClick={() => setActiveService(choice.serviceId)}
                  >
                    {serviceById.get(choice.serviceId)?.displayName}
                  </button>
                ))}
              </div>
              {selected && (
                <section className="service-options">
                  <span className="eyebrow">
                    {familyLabels[serviceById.get(selected.serviceId)!.serviceFamily]}
                  </span>
                  <h3>{serviceById.get(selected.serviceId)?.displayName}</h3>
                  <GalleryReference family={serviceById.get(selected.serviceId)!.serviceFamily} />
                  <ServiceFields
                    choice={selected}
                    build={build}
                    onChange={select}
                    showErrors={errors.length > 0}
                  />
                  {serviceById.get(selected.serviceId)?.serviceFamily === 'stippling' && (
                    <details className="legacy-addon-options">
                      <summary>Additional work from the legacy catalog</summary>
                      <p className="form-note">
                        Options already available above are configured inside the package. Other
                        legacy work needs confirmation and is excluded from the payable subtotal.
                      </p>
                      {serviceOptions
                        .filter((a) => !a.bindings.some((b) => b.serviceId === selected.serviceId))
                        .map((a) => (
                          <label key={a.id}>
                            <input
                              type="checkbox"
                              checked={selected.optionIds.includes(a.id)}
                              onChange={(e) =>
                                select({
                                  ...selected,
                                  optionIds: e.target.checked
                                    ? [...selected.optionIds, a.id]
                                    : selected.optionIds.filter((id) => id !== a.id),
                                })
                              }
                            />
                            <span>
                              {a.displayName}
                              <small>
                                Review required · source reference {money(a.basePriceCents)}
                              </small>
                            </span>
                          </label>
                        ))}
                    </details>
                  )}
                </section>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <dl className="review-summary">
                <div>
                  <dt>Platform</dt>
                  <dd>{platformTitle(build.firearm)}</dd>
                </div>
                <div>
                  <dt>Component</dt>
                  <dd>{componentLabels[build.firearm.componentType]}</dd>
                </div>
                <div>
                  <dt>Variant</dt>
                  <dd>{variantLabel(build.firearm)}</dd>
                </div>
              </dl>
              {priced.services.map((s) => (
                <section className="review-service" key={s.serviceId}>
                  <div>
                    <h3>{s.title}</h3>
                    <ServiceDetails service={s} showBreakdown />
                  </div>
                  <strong>{money(s.calculatedPriceCents)}</strong>
                </section>
              ))}
              <div className="notice">
                <span className="eyebrow">
                  {priced.orderability === 'ready'
                    ? 'Ready for checkout'
                    : 'Configuration review required'}
                </span>
                <p>
                  {priced.orderability === 'ready'
                    ? 'Your required choices and published option prices are complete. Continue to the cart. Live payment remains disabled in this build.'
                    : priced.reviewReasons.join(' ')}
                </p>
                {priced.orderability !== 'ready' && (
                  <Link className="text-link" href="/custom-inquiry">
                    Request a configuration review
                  </Link>
                )}
              </div>
            </>
          )}
          <div className="configuration-actions">
            <button
              className="button button-secondary"
              disabled={step === 0}
              onClick={() => {
                setStep((s) => s - 1);
                setErrors([]);
              }}
            >
              Back
            </button>
            {step < 3 ? (
              <button className="button" onClick={next}>
                Continue
              </button>
            ) : (
              <button className="button" disabled={!initialized} onClick={save}>
                Add build to cart
              </button>
            )}
          </div>
        </section>
        <BuildSummary build={priced} />
      </div>
    </>
  );
}
