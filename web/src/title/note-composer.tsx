/** Rédaction d'un avis ou d'un moment, avec épisode, instant et version. */
import { useEffect, useRef, useState, type FormEvent, type ReactElement, type RefObject } from 'react';
import { parseTime } from '../shared/labels';
import { COMMON_LANGS, langName } from '../shared/languages';
import { Segmented } from '../shared/segmented';
import type { Draft } from './seasons-panel';
import type { TitleActions } from './use-title-state';

type Props = { t: TitleActions; isTv: boolean; original: string; draft: Draft; onDone: () => void };

function useFocusOnDraft(draft: Draft): RefObject<HTMLTextAreaElement | null> {
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!draft) return;
    area.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    area.current?.focus({ preventScroll: true });
  }, [draft]);
  return area;
}

function Tiny(p: { placeholder: string; value: string; onChange: (v: string) => void }): ReactElement {
  return (
    <input
      className="field tiny"
      placeholder={p.placeholder}
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  );
}

function VersionSelect({
  original,
  value,
  onChange,
}: {
  original: string;
  value: string;
  onChange: (v: string) => void;
}): ReactElement {
  return (
    <select className="chip select" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Version">
      <option value="">Version ?</option>
      {[...new Set([original, ...COMMON_LANGS])].map((l) => (
        <option key={l} value={l}>
          {l === original ? `VO · ${langName(l)}` : langName(l)}
        </option>
      ))}
    </select>
  );
}

const KINDS: { value: 'avis' | 'moment'; label: string }[] = [
  { value: 'avis', label: 'Avis' },
  { value: 'moment', label: 'Moment' },
];

function useNoteForm(draft: Draft) {
  const [f, setF] = useState({ kind: draft ? 'moment' : 'avis', season: String(draft?.season ?? ''),
    episode: String(draft?.episode ?? ''), time: '', language: '', body: '' });
  const set = (key: keyof typeof f) => (v: string) => setF((cur) => ({ ...cur, [key]: v }));
  const payload = (): Record<string, unknown> => ({ kind: f.kind, body: f.body, language: f.language || null,
    atSeconds: parseTime(f.time), season: f.season ? Number(f.season) : null,
    episode: f.episode ? Number(f.episode) : null });
  return { f, set, payload, reset: () => setF((cur) => ({ ...cur, body: '', time: '' })) };
}

export function NoteComposer({ t, isTv, original, draft, onDone }: Props): ReactElement {
  const { f, set, payload, reset } = useNoteForm(draft);
  const area = useFocusOnDraft(draft);
  const kind = f.kind === 'moment' ? 'moment' : 'avis';
  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!f.body.trim()) return;
    await t.act('POST', 'notes', payload());
    reset();
    onDone();
  };
  return (
    <form className="card composer" onSubmit={submit}>
      <div className="row">
        <Segmented options={KINDS} value={kind} onChange={set('kind')} />
        {isTv && <Tiny placeholder="Saison" value={f.season} onChange={set('season')} />}
        {isTv && <Tiny placeholder="Épisode" value={f.episode} onChange={set('episode')} />}
        {kind === 'moment' && <Tiny placeholder="12:34" value={f.time} onChange={set('time')} />}
        <VersionSelect original={original} value={f.language} onChange={set('language')} />
      </div>
      <textarea ref={area} className="field" value={f.body} onChange={(e) => set('body')(e.target.value)}
        placeholder={kind === 'moment' ? 'Ce passage qui m’a marqué…' : 'Ce que j’en ai pensé…'} />
      <div className="row"><button className="btn primary" disabled={!f.body.trim()}>Publier</button></div>
    </form>
  );
}
