'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="wrap not-found">
      <span className="eyebrow">Something interrupted this page</span>
      <h1>Let’s try that again.</h1>
      <p>
        The page could not finish loading. Retry, or contact the shop directly at
        sales@defiantmachineworks.com.
      </p>
      <div className="button-row">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button-secondary" href="/contact">
          Contact Defiant
        </Link>
      </div>
    </section>
  );
}
