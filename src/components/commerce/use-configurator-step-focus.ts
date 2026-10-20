'use client';
import { useLayoutEffect, useRef } from 'react';

export function useConfiguratorStepFocus(step: number) {
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  const previousStep = useRef(step);

  useLayoutEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    heading.current?.focus({ preventScroll: true });
    // The panel uses the root's responsive header padding without the heading's extra margin.
    panel.current?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
  }, [step]);

  return { heading, panel };
}
