import { ButtonLink } from '@/components/ui/primitives';
export default function NotFound() {
  return (
    <section className="wrap not-found">
      <span className="eyebrow">404 / Outside the work area</span>
      <h1>
        This page
        <br />
        isn’t in the plans.
      </h1>
      <p>
        The address may have changed. Explore the work or contact Defiant to find what you need.
      </p>
      <div className="button-row">
        <ButtonLink href="/services">Explore services</ButtonLink>
        <ButtonLink href="/contact" secondary>
          Contact the shop
        </ButtonLink>
      </div>
    </section>
  );
}
