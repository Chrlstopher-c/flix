/** Noms des langues en français et étiquettes de version (VO, VF, VOSTFR…). */
const NAMES = new Intl.DisplayNames(['fr'], { type: 'language' });

export function langName(code: string | null | undefined): string {
  if (!code || code === 'xx') return 'Sans dialogue';
  try {
    const n = NAMES.of(code) ?? code;
    return n.charAt(0).toUpperCase() + n.slice(1);
  } catch {
    return code;
  }
}

export const COMMON_LANGS = ['fr', 'en', 'ja', 'ko', 'es', 'it', 'de', 'pt', 'zh', 'hi'];

/** Jetons de visionnage : « audio:fr », « sub:en ». */
export function viewingLabel(token: string): string {
  const [kind, code] = token.split(':');
  return `${kind === 'sub' ? 'Sous-titres' : 'Audio'} ${langName(code)}`;
}

export function shortVersion(tokens: string[], original: string | null): string | null {
  const audio = tokens.find((t) => t.startsWith('audio:'))?.slice(6);
  const sub = tokens.find((t) => t.startsWith('sub:'))?.slice(4);
  if (!audio) return null;
  const base = audio === original ? 'VO' : `V${audio.toUpperCase().slice(0, 2)}`;
  return sub ? `${base}ST${sub.toUpperCase().slice(0, 2)}` : base;
}
