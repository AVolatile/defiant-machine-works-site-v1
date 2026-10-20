'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { serviceCatalog, serviceById } from '@/lib/commerce/catalog';
import { isStandaloneCoatingId } from '@/lib/commerce/coating-context';
import { priceBuild } from '@/lib/commerce/pricing';
import { money, type BuildConfiguration } from '@/lib/commerce/schema';
import { cartActions } from './cart-store';
import { BuildSummary, ServiceDetails } from './build-summary';
import { GalleryReference } from './gallery-reference';
import { OptionCard } from './option-card';
import { ServiceFields } from './service-fields';
import { useConfiguratorStepFocus } from './use-configurator-step-focus';

const steps = ['Scope', 'Treatment & finish', 'Review'];
const scopes = serviceCatalog.filter(
  (entry) => isStandaloneCoatingId(entry.serviceId) && entry.status === 'active',
);
const scopeLabels: Partial<Record<BuildConfiguration['firearm']['componentType'], string>> = {
  'complete-firearm': 'Complete Pistol',
  frame: 'Frame Only',
  slide: 'Slide Only',
};

function initialConfiguration(product: string): BuildConfiguration {
  const entry = scopes.find((entry) => entry.serviceId === product);
  return {
    schemaVersion: 3,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    firearm: {
      manufacturerId: '',
      modelId: '',
      variantId: '',
      generationId: 'unspecified',
      componentType: entry?.componentScope || 'complete-firearm',
    },
    services: entry ? [{ serviceId: entry.serviceId, optionIds: [], attributes: {} }] : [],
  };
}

export function CoatingConfigurator({
  initialBuild,
  product = '',
}: {
  initialBuild?: BuildConfiguration;
  product?: string;
}) {
  const [build, setBuild] = useState(() =>
    initialBuild ? structuredClone(initialBuild) : initialConfiguration(product),
  );
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const { heading, panel } = useConfiguratorStepFocus(step);
  const errorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const priced = priceBuild(build);
  const choice = build.services[0];
  const entry = choice && serviceById.get(choice.serviceId);

  function move(to: number) {
    setErrors([]);
    setStep(to);
  }
  function next() {
    const problems = step === 0 ? (entry ? [] : ['Choose a coating scope.']) : priced.errors;
    if (problems.length) {
      setErrors(problems);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    move(step + 1);
  }
  function save() {
    if (priced.errors.length) {
      setErrors(priced.errors);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    try {
      cartActions.saveBuild(build);
      router.push('/cart');
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Your coating could not be saved.']);
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <>
      <div className="commerce-top-note">
        <span className="review-label">Cerakote</span>
        <p>Choose the scope, treatment and finish.</p>
        <Link href="/custom-inquiry">Custom finish? Send an inquiry</Link>
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
            {initialBuild ? 'Edit coating' : 'Configure your coating'} / 0{step + 1}
          </span>
          <h2 ref={heading} tabIndex={-1}>
            {['What are we coating?', 'Choose your finish.', 'Review your coating.'][step]}
          </h2>
          {errors.length > 0 && (
            <div className="form-error" role="alert" ref={errorRef} tabIndex={-1}>
              <strong>Check your coating choices.</strong>
              <ul>
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <GalleryReference family="cerakote" />
          {step === 0 && (
            <fieldset
              className="option-picker"
              aria-describedby={errors.length && !entry ? 'coating-scope-error' : undefined}
            >
              <legend>Coating scope</legend>
              <div className="service-package-grid">
                {scopes.map((scope) => (
                  <OptionCard
                    key={scope.serviceId}
                    type="radio"
                    name="coating-scope"
                    value={scope.serviceId}
                    title={scopeLabels[scope.componentScope] || scope.displayName}
                    description={scope.displayName}
                    price={`From ${money(scope.basePriceCents)}`}
                    checked={choice?.serviceId === scope.serviceId}
                    required
                    describedBy={errors.length && !entry ? 'coating-scope-error' : undefined}
                    onChange={() => {
                      if (choice?.serviceId === scope.serviceId) return;
                      setBuild({
                        ...build,
                        firearm: { ...build.firearm, componentType: scope.componentScope },
                        services: [{ serviceId: scope.serviceId, optionIds: [], attributes: {} }],
                      });
                      setErrors([]);
                    }}
                  />
                ))}
              </div>
              {errors.length > 0 && !entry && (
                <p className="field-error" id="coating-scope-error">
                  Choose a coating scope.
                </p>
              )}
              <p className="form-note">
                Choose the parts to coat. Changing scope resets the treatment and finish choices.
              </p>
            </fieldset>
          )}
          {step === 1 && choice && entry && (
            <section className="service-options">
              <h3>{entry.displayName}</h3>
              <ServiceFields
                choice={choice}
                build={build}
                showErrors={errors.length > 0}
                onChange={(updated) => {
                  setBuild({ ...build, services: [updated] });
                  setErrors([]);
                }}
              />
            </section>
          )}
          {step === 2 && (
            <>
              {priced.services.map((service) => (
                <section className="review-service" key={service.serviceId}>
                  <div>
                    <h3>{service.title}</h3>
                    <ServiceDetails service={service} showBreakdown />
                  </div>
                  <strong>{money(service.calculatedPriceCents)}</strong>
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
                    ? 'Your coating choices and published prices are complete. Continue to the cart.'
                    : priced.reviewReasons.join(' ')}
                </p>
                {priced.orderability !== 'ready' && (
                  <Link href="/custom-inquiry">Request a configuration review</Link>
                )}
              </div>
            </>
          )}
          <div className="configuration-actions">
            <button
              className="button button-secondary"
              disabled={step === 0}
              onClick={() => move(step - 1)}
            >
              Back
            </button>
            {step < 2 ? (
              <button className="button" onClick={next}>
                Continue
              </button>
            ) : (
              <button className="button" onClick={save}>
                Add build to cart
              </button>
            )}
          </div>
        </section>
        <BuildSummary build={priced} title={!choice ? 'Your coating' : undefined} />
      </div>
    </>
  );
}
