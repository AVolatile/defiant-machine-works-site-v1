export function OptionCard({
  title,
  description,
  context,
  price,
  status,
  type,
  name,
  value,
  checked,
  disabled = false,
  required = false,
  describedBy,
  accessibleName = title,
  className = '',
  onChange,
}: {
  title: string;
  description?: string;
  context?: string;
  price?: string;
  status?: string;
  type: 'radio' | 'checkbox';
  name?: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  required?: boolean;
  describedBy?: string;
  accessibleName?: string;
  className?: string;
  onChange?: () => void;
}) {
  return (
    <label className={`option-card ${className}`}>
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        required={required}
        aria-label={accessibleName}
        aria-describedby={describedBy}
        onChange={onChange}
      />
      <span className="option-card-copy">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
        {context && <small>{context}</small>}
        <span className="option-card-meta">
          {price && <span className="option-card-price">{price}</span>}
          {status && <span className="option-card-status">{status}</span>}
        </span>
      </span>
    </label>
  );
}
