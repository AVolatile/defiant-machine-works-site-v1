'use client';
import { Fragment } from 'react';
import {
  activeSourceFields,
  configurationFor,
  sourceSelections,
  updateSourceSelection,
  optionProblem,
} from '@/lib/commerce/service-configuration';
import { platformTitle } from '@/lib/commerce/catalog';
import { money, type BuildConfiguration, type ServiceSelection } from '@/lib/commerce/schema';
import { OptionPicker } from './option-picker';
import { GalleryReference } from './gallery-reference';
export function ServiceFields({
  choice,
  build,
  onChange,
  showErrors = false,
}: {
  choice: ServiceSelection;
  build: BuildConfiguration;
  onChange: (choice: ServiceSelection) => void;
  showErrors?: boolean;
}) {
  const values = sourceSelections(choice, build),
    fields = activeSourceFields(choice.serviceId, values).sort(
      (a, b) => Number(b.role === 'texture') - Number(a.role === 'texture'),
    ),
    service = configurationFor(choice.serviceId);
  if (!service) return null;
  const firstPackageFinish =
    service.serviceFamily !== 'cerakote'
      ? fields.find((field) => ['finish', 'finish-secondary', 'camo'].includes(field.role))
      : undefined;
  return (
    <>
      {service.fixedOpticId && (
        <div className="notice">
          <span className="eyebrow">Included machining specification</span>
          {service.includedFeatures.map((f) => (
            <p key={f.id}>{f.label}</p>
          ))}
        </div>
      )}
      {service.componentScope === 'extension' && (
        <p className="form-note">
          This service is for a customer-supplied magazine extension. Include that item with your
          project.
        </p>
      )}
      {fields.map((field) => {
        const id = `${choice.serviceId}-${field.id}`;
        const error =
          showErrors && field.required && !values[field.id]
            ? `Choose ${field.displayName}.`
            : undefined;
        if (field.role === 'model' && values[field.id])
          return (
            <p className="form-note" key={id}>
              Service model: {platformTitle(build.firearm)}
            </p>
          );
        if (['texture', 'finish', 'finish-secondary', 'camo'].includes(field.role))
          return (
            <Fragment key={id}>
              {field.id === firstPackageFinish?.id && <GalleryReference family="cerakote" />}
              <OptionPicker
                field={field}
                error={error}
                value={values[field.id] || ''}
                serviceId={choice.serviceId}
                onChange={(value) => onChange(updateSourceSelection(choice, build, field, value))}
              />
            </Fragment>
          );
        return (
          <div key={id} className="service-field">
            <label htmlFor={id}>
              {field.displayName}
              {field.required ? <span aria-hidden="true"> *</span> : ' (optional)'}
            </label>
            <select
              id={id}
              required={field.required}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              value={values[field.id] || ''}
              onChange={(e) =>
                onChange(updateSourceSelection(choice, build, field, e.target.value))
              }
            >
              <option value="">Select {field.displayName}</option>
              {field.options.map((option) => (
                <option key={option.id} value={option.id} disabled={!!optionProblem(option, build)}>
                  {option.displayName}
                  {option.deltaCents
                    ? ` / ${option.deltaCents > 0 ? '+' : ''}${money(option.deltaCents)}`
                    : ' / included'}
                </option>
              ))}
            </select>
            {error && (
              <p className="field-error" id={`${id}-error`}>
                {error}
              </p>
            )}
            {field.options.some((o) => o.requirements.length > 0) && (
              <p className="form-note">
                Generation-specific treatments require the matching generation group in Platform.
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}
