import type { CSSProperties } from 'react';
type Name =
  'diagonal' | 'chevron-right' | 'chevron-down' | 'target' | 'shield' | 'bag' | 'check' | 'close';
const paths: Record<Name, React.ReactNode> = {
  diagonal: (
    <>
      <path d="M5 19 19 5M5 5h14v14" />
    </>
  ),
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  target: (
    <>
      <path d="M12 3v5m0 8v5M3 12h5m8 0h5" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
};
export function Icon({
  name,
  className = '',
  style,
}: {
  name: Name;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={`icon icon-${name} ${className}`}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {paths[name]}
    </svg>
  );
}
export function ProofIcon({ name }: { name: 'target' | 'shield' }) {
  return (
    <span className="proof-icon-frame">
      <Icon name={name} />
    </span>
  );
}
