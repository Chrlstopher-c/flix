/** Recherche dans tout le catalogue TMDB : titres et personnes. */
import { AnimatePresence } from 'framer-motion';
import { useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';
import { KIND_PLURAL } from '../shared/labels';
import { Poster } from '../shared/poster';
import { Segmented } from '../shared/segmented';
import { TitleCard } from '../shared/title-card';
import type { Card, Kind } from '../shared/types';
import { useApi } from '../shared/use-api';
import { useDebounced } from '../shared/use-debounced';
import { useLibrary } from '../shared/use-library';

type PersonHit = { id: number; name: string; profile: string | null; dept: string };
type Filter = 'all' | Kind;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'film', label: KIND_PLURAL.film },
  { value: 'serie', label: KIND_PLURAL.serie },
  { value: 'anime', label: KIND_PLURAL.anime },
];

function People({ people }: { people: PersonHit[] }): ReactElement | null {
  if (!people.length) return null;
  return (
    <div className="scroller people-row">
      {people.slice(0, 12).map((p) => (
        <Link key={p.id} to={`/personne/${p.id}`} className="person-chip">
          <Poster path={p.profile} size="w185" alt={p.name} ratio="1" className="round" />
          <span>{p.name}</span>
        </Link>
      ))}
    </div>
  );
}

export function SearchPage(): ReactElement {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [filter, setFilter] = useState<Filter>('all');
  const query = useDebounced(q.trim());
  const { data, loading } = useApi<{ results: Card[]; people: PersonHit[] }>(
    query ? `/api/tmdb/search?q=${encodeURIComponent(query)}` : null,
  );
  const { data: lib } = useLibrary();
  const entries = new Map(lib?.titles.map((t) => [t.id, t.entries]));
  const results = (data?.results ?? []).filter((c) => filter === 'all' || c.kind === filter);

  return (
    <div className="page search">
      <input
        className="search-input serif"
        placeholder="Un film, une série, un animé, un acteur…"
        autoFocus
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
        }}
      />
      <div className="row search-filters">
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      {query && data && <People people={data.people} />}
      {query && loading && <p className="faint">Recherche…</p>}
      {query && data && results.length === 0 && <p className="muted">Rien trouvé pour « {query} ».</p>}
      <div className="grid">
        <AnimatePresence mode="popLayout">
          {results.map((c) => (
            <TitleCard key={c.id} {...c} entries={entries.get(c.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
