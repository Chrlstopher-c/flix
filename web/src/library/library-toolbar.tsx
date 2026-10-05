/** Barre de filtres de la bibliothèque. */
import type { ReactElement } from 'react';
import { useSession } from '../auth/session';
import { KIND_OPTIONS, STATUS_LABEL, STATUS_ORDER } from '../shared/labels';
import { langName } from '../shared/languages';
import { Segmented } from '../shared/segmented';
import type { LibraryTitle, Tag } from '../shared/types';
import { titleLanguages, type Filters, type Sort, type Who } from './filters';

type Props = { filters: Filters; onChange: (f: Filters) => void; titles: LibraryTitle[]; tags: Tag[] };

const SORTS: { value: Sort; label: string }[] = [
  { value: 'recent', label: 'Activité récente' },
  { value: 'name', label: 'Nom' },
  { value: 'year', label: 'Année' },
  { value: 'rating', label: 'Note' },
];

function StatusAndTags({
  f,
  set,
  tags,
}: {
  f: Filters;
  set: (p: Partial<Filters>) => void;
  tags: Tag[];
}): ReactElement {
  return (
    <>
      {(['all', ...STATUS_ORDER] as const).map((s) => (
        <button key={s} className={f.status === s ? 'chip on' : 'chip'} onClick={() => set({ status: s })}>
          {s !== 'all' && <span className="dot" style={{ background: `var(--st-${s})` }} />}
          {s === 'all' ? 'Tous statuts' : STATUS_LABEL[s]}
        </button>
      ))}
      <span className="toolbar-sep" />
      {tags.map((t) => (
        <button
          key={t.id}
          className={f.tag === t.id ? 'chip on' : 'chip'}
          onClick={() => set({ tag: f.tag === t.id ? null : t.id })}
        >
          <span className="dot" style={{ background: t.color }} />
          {t.name}
        </button>
      ))}
    </>
  );
}

function Selects({ f, set, langs }: { f: Filters; set: (p: Partial<Filters>) => void; langs: string[] }): ReactElement {
  return (
    <>
      <select className="chip select" value={f.lang ?? ''} onChange={(e) => set({ lang: e.target.value || null })}>
        <option value="">Toutes langues</option>
        {langs.map((l) => <option key={l} value={l}>{langName(l)}</option>)}
      </select>
      <select className="chip select" value={f.sort}
        onChange={(e) => set({ sort: SORTS.find((s) => s.value === e.target.value)?.value ?? 'recent' })}>
        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </>
  );
}

function useWhoOptions(): { value: Who; label: string; color?: string }[] {
  const { me, users } = useSession();
  const other = users.find((u) => u.id !== me.id);
  return [
    { value: 'all', label: 'Tout le monde' },
    { value: 'me', label: 'Moi', color: me.color },
    ...(other ? [{ value: 'other' as const, label: other.name, color: other.color }] : []),
    { value: 'both', label: 'Nous deux' },
  ];
}

export function LibraryToolbar({ filters: f, onChange, titles, tags }: Props): ReactElement {
  const who = useWhoOptions();
  const set = (patch: Partial<Filters>): void => onChange({ ...f, ...patch });
  const langs = [...new Set(titles.flatMap(titleLanguages))]
    .sort((a, b) => langName(a).localeCompare(langName(b), 'fr'));
  return (
    <div className="toolbar">
      <div className="row">
        <Segmented options={KIND_OPTIONS} value={f.kind} onChange={(kind) => set({ kind })} />
        <Segmented options={who} value={f.who} onChange={(w) => set({ who: w })} />
      </div>
      <div className="row">
        <StatusAndTags f={f} set={set} tags={tags} />
        <Selects f={f} set={set} langs={langs} />
      </div>
    </div>
  );
}
