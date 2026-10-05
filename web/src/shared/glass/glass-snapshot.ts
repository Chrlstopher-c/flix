/** Capture de page partagée par tous les verres : reprise quand la page change, jamais deux à la fois. */
import type { GlassInstance } from './liquid-glass';

const IGNORED = ['glass-container', 'glass-button', 'glass-button-text'];
const DEBOUNCE_MS = 700;

let timer: ReturnType<typeof setTimeout> | undefined;
let running = false;
let again = false;
const listeners = new Set<() => void>();

function ignore(el: Element): boolean {
  return IGNORED.some((c) => el.classList?.contains(c));
}

function upload(c: GlassInstance, snap: HTMLCanvasElement, pageHeight: number): void {
  const { gl, texture, textureSizeLoc, pageHeightLoc } = c.gl_refs;
  if (!gl || !texture) return;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snap);
  if (textureSizeLoc) gl.uniform2f(textureSizeLoc, snap.width, snap.height);
  if (pageHeightLoc) gl.uniform1f(pageHeightLoc, pageHeight);
  c.render?.();
}

async function capture(): Promise<void> {
  const C = window.Container;
  const h2c = window.html2canvas;
  if (!C || !h2c || !C.instances.length) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  try {
    const snap = await h2c(document.body, {
      scale: 1,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      ignoreElements: ignore,
    });
    C.pageSnapshot = snap;
    const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (const c of C.instances) upload(c, snap, pageHeight);
    listeners.forEach((l) => l());
  } catch (err) {
    console.warn('Capture du verre impossible', err);
  } finally {
    running = false;
    if (again) {
      again = false;
      scheduleSnapshot();
    }
  }
}

export function scheduleSnapshot(delay = DEBOUNCE_MS): void {
  clearTimeout(timer);
  timer = setTimeout(() => void capture(), delay);
}

export function onSnapshot(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Surveille la page : contenu ajouté, image chargée, fenêtre redimensionnée. */
export function watchPage(root: HTMLElement): () => void {
  const mo = new MutationObserver(() => scheduleSnapshot());
  mo.observe(root, { childList: true, subtree: true });
  const onLoad = (e: Event): void => {
    if (e.target instanceof HTMLImageElement) scheduleSnapshot();
  };
  const onResize = (): void => scheduleSnapshot(300);
  document.addEventListener('load', onLoad, true);
  addEventListener('resize', onResize);
  return () => {
    mo.disconnect();
    document.removeEventListener('load', onLoad, true);
    removeEventListener('resize', onResize);
  };
}

/** Luminosité moyenne derrière un élément, lue dans la capture (0 noir, 1 blanc). */
export function backdropLuma(el: HTMLElement): number {
  const snap = window.Container?.pageSnapshot;
  if (!snap) return 0;
  const r = el.getBoundingClientRect();
  try {
    const ctx = snap.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0;
    const { data } = ctx.getImageData(
      Math.max(0, r.left),
      Math.max(0, r.top + scrollY),
      Math.max(1, r.width),
      Math.max(1, r.height),
    );
    let sum = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4 * 97) {
      sum += 0.2126 * (data[i] ?? 0) + 0.7152 * (data[i + 1] ?? 0) + 0.0722 * (data[i + 2] ?? 0);
      n++;
    }
    return n ? sum / n / 255 : 0;
  } catch {
    return 0;
  }
}
