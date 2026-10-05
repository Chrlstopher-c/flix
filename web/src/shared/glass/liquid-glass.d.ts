/** Typage minimal de la librairie liquid-glass-js chargée en script classique (public/vendor/liquid-glass). */
export type GlassRefs = {
  gl?: WebGLRenderingContext;
  texture?: WebGLTexture;
  textureSizeLoc?: WebGLUniformLocation | null;
  pageHeightLoc?: WebGLUniformLocation | null;
};

export type GlassInstance = {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  gl_refs: GlassRefs;
  gl?: WebGLRenderingContext | null;
  webglInitialized: boolean;
  render?: () => void;
  updateSizeFromDOM: () => void;
};

export type GlassCtor = {
  new (opts: { type: 'rounded' | 'pill' | 'circle'; borderRadius: number; tintOpacity: number }): GlassInstance;
  instances: GlassInstance[];
  pageSnapshot: HTMLCanvasElement | null;
};

type Html2Canvas = (el: HTMLElement, opts: Record<string, unknown>) => Promise<HTMLCanvasElement>;

declare global {
  interface Window {
    Container?: GlassCtor;
    html2canvas?: Html2Canvas;
  }
}
