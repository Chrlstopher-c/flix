/** Version regardée : langue audio et sous-titres. */
import type { ReactElement } from 'react';
import { COMMON_LANGS, langName } from '../shared/languages';

type Props = { value: string[]; original: string; available: string[]; onChange: (v: string[]) => void };

export function ViewingLanguages({ value, original, available, onChange }: Props): ReactElement {
  const audio = value.find((t) => t.startsWith('audio:'))?.slice(6) ?? '';
  const sub = value.find((t) => t.startsWith('sub:'))?.slice(4) ?? '';
  const langs = [...new Set([original, ...available, ...COMMON_LANGS])].filter(Boolean);
  const set = (a: string, s: string): void => onChange([a && `audio:${a}`, s && `sub:${s}`].filter(Boolean));
  const option = (l: string): ReactElement => (
    <option key={l} value={l}>
      {langName(l)}
      {l === original ? ' (VO)' : ''}
    </option>
  );
  return (
    <div className="row viewing">
      <label className="mini-select">
        <span>Audio</span>
        <select value={audio} onChange={(e) => set(e.target.value, sub)}>
          <option value="">—</option>
          {langs.map(option)}
        </select>
      </label>
      <label className="mini-select">
        <span>Sous-titres</span>
        <select value={sub} onChange={(e) => set(audio, e.target.value)}>
          <option value="">Aucun</option>
          {langs.map(option)}
        </select>
      </label>
    </div>
  );
}
