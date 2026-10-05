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

export function NoteComposer({ t, isTv, original, draft, onDone }: Props): ReactElement {
  const [kind, setKind] = useState<'avis' | 'moment'>(draft ? 'moment' : 'avis');
  const [season, setSeason] = useState(String(draft?.season ?? ''));
  const [episode, setEpisode] = useState(String(draft?.episode ?? ''));
  const [time, setTime] = useState('');
  const [language, setLanguage] = useState('');
  const [body, setBody] = useState('');
  const area = useFocusOnDraft(draft);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!body.trim()) return;
    await t.act('POST', 'notes', {
      kind,
      body,
      language: language || null,
      atSeconds: parseTime(time),
      season: season ? Number(season) : null,
      episode: episode ? Number(episode) : null,
    });
    setBody('');
    setTime('');
    onDone();
  };

  return (
    <form className="card composer" onSubmit={submit}>
      <div className="row">
        <Segmented
          options={[
            { value: 'avis', label: 'Avis' },
            { value: 'moment', label: 'Moment' },
          ]}
          value={kind}
          onChange={setKind}
        />
        {isTv && <Tiny placeholder="Saison" value={season} onChange={setSeason} />}
        {isTv && <Tiny placeholder="Épisode" value={episode} onChange={setEpisode} />}
        {kind === 'moment' && <Tiny placeholder="12:34" value={time} onChange={setTime} />}
        <VersionSelect original={original} value={language} onChange={setLanguage} />
      </div>
      <textarea
        ref={area}
        className="field"
        placeholder={kind === 'moment' ? 'Ce passage qui m’a marqué…' : 'Ce que j’en ai pensé…'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="row">
        <button className="btn primary" disabled={!body.trim()}>
          Publier
        </button>
      </div>
    </form>
  );
}
