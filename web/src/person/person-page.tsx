/** Fiche d'une personne : biographie et filmographie complète, filtrable. */
import { AnimatePresence } from 'framer-motion';
import { useMemo, useState, type ReactElement } from 'react';
import { useParams } from 'react-router';
import { toKind } from '../shared/kind';
import { KIND_PLURAL } from '../shared/labels';
import { Poster } from '../shared/poster';
import { Segmented } from '../shared/segmented';
import { TitleCard } from '../shared/title-card';
import type { Card, Kind } from '../shared/types';
import { useApi } from '../shared/use-api';
import { useLibrary } from '../shared/use-library';

type Credit = Record<string, unknown> & {
  character?: string;
  job?: string;
  release_date?: string;
  first_air_date?: string;
};
type PersonDetails = {
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  combined_credits: { cast: Credit[]; crew: Credit[] };
};
type Line = Card & { role: string };

function credits(p: PersonDetails): Line[] {
  const seen = new Map<string, Line>();
  for (const c of [...p.combined_credits.cast, ...p.combined_credits.crew]) {
    const card = toKind(c, 'movie');
    if (!card || seen.has(card.id)) continue;
    seen.set(card.id, { ...card, role: c.character || c.job || '' });
  }
  return [...seen.values()].sort((a, b) => (b.year ?? 9999) - (a.year ?? 9999));
}

function ageOf(p: PersonDetails): number | null {
  if (!p.birthday) return null;
  const end = p.deathday ? new Date(p.deathday) : new Date();
  return end.getFullYear() - new Date(p.birthday).getFullYear();
}

function PersonHead({ p, total, owned }: { p: PersonDetails; total: number; owned: number }): ReactElement {
  const [open, setOpen] = useState(false);
  const age = ageOf(p);
  const born = p.birthday && `Né·e le ${new Date(p.birthday).toLocaleDateString('fr-FR')}`;
  return (
    <div className="person-head">
      <div className="person-photo">
        <Poster path={p.profile_path} size="h632" alt={p.name} />
      </div>
      <div className="stack">
        <div className="eyebrow">{p.known_for_department === 'Acting' ? 'Interprète' : p.known_for_department}</div>
        <h1>{p.name}</h1>
        <div className="faint">{[born, age && `${age} ans`, p.place_of_birth].filter(Boolean).join(' · ')}</div>
        {p.biography && (
          <p className={open ? 'bio open' : 'bio'} onClick={() => setOpen(!open)}>
            {p.biography}
          </p>
        )}
        <div className="faint">
          {total} titres · {owned} dans notre bibliothèque
        </div>
      </div>
    </div>
  );
}

export function PersonPage(): ReactElement {
  const { id } = useParams();
  const { data: p } = useApi<PersonDetails>(`/api/tmdb/person/${id}`);
  const { data: lib } = useLibrary();
  const [kind, setKind] = useState<'all' | Kind>('all');
  const lines = useMemo(() => (p ? credits(p) : []), [p]);
  if (!p)
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 320, borderRadius: 14 }} />
      </div>
    );
  const entries = new Map(lib?.titles.map((t) => [t.id, t.entries]));
  const shown = lines.filter((l) => kind === 'all' || l.kind === kind);

  return (
    <div className="page person">
      <PersonHead p={p} total={lines.length} owned={lines.filter((l) => entries.has(l.id)).length} />
      <div className="section-head section">
        <h2>Filmographie</h2>
        <Segmented
          options={[
            { value: 'all', label: 'Tout' },
            ...(['film', 'serie', 'anime'] as const).map((k) => ({ value: k, label: KIND_PLURAL[k] })),
          ]}
          value={kind}
          onChange={setKind}
        />
      </div>
      <div className="grid">
        <AnimatePresence mode="popLayout">
          {shown.map((l) => (
            <TitleCard
              key={l.id}
              {...l}
              entries={entries.get(l.id)}
              hint={[l.year, l.role].filter(Boolean).join(' · ')}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
