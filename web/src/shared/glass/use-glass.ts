/** Greffe un verre liquide sur un élément React : la librairie fournit le canevas, React garde le contenu. */
import { useEffect, useRef, type RefObject } from 'react';
import { backdropLuma, onSnapshot, scheduleSnapshot } from './glass-snapshot';
import type { GlassInstance } from './liquid-glass';

type Options = { pill?: boolean; radius?: number; tint?: number; adaptive?: boolean };

const LIGHT_THRESHOLD = 0.58;

function destroy(c: GlassInstance): void {
  const C = window.Container;
  if (C) C.instances.splice(C.instances.indexOf(c), 1);
  c.gl_refs.gl?.getExtension('WEBGL_lose_context')?.loseContext();
  c.gl_refs = {};
  c.gl = null;
  c.canvas.remove();
}

/** Texte sombre quand le fond derrière le verre est clair, recalculé au défilement. */
function adapt(el: HTMLElement): () => void {
  let queued = false;
  const update = (): void => {
    queued = false;
    el.classList.toggle('on-light', backdropLuma(el) > LIGHT_THRESHOLD);
  };
  const queue = (): void => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', queue, { passive: true });
  const off = onSnapshot(update);
  return () => {
    removeEventListener('scroll', queue);
    off();
  };
}

export function useGlass<T extends HTMLElement>({
  pill = false,
  radius = 28,
  tint = 0.28,
  adaptive = false,
}: Options = {}): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    const C = window.Container;
    if (!el || !C) return;
    el.classList.add('glass-container', 'glass-host');
    const c = new C({ type: pill ? 'pill' : 'rounded', borderRadius: radius, tintOpacity: tint });
    el.prepend(c.canvas);
    c.element.remove();
    c.element = el;
    c.updateSizeFromDOM();
    const ro = new ResizeObserver(() => c.updateSizeFromDOM());
    ro.observe(el);
    const stopAdapt = adaptive ? adapt(el) : () => undefined;
    scheduleSnapshot();
    return () => {
      ro.disconnect();
      stopAdapt();
      destroy(c);
    };
  }, [pill, radius, tint, adaptive]);
  return ref;
}
