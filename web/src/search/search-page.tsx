/** Recherche dans tout le catalogue TMDB : titres et personnes. */
import { AnimatePresence } from 'framer-motion';
import { useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';
import { KIND_OPTIONS } from '../shared/labels';
import { Poster } from '../shared/poster';
import { Segmented } from '../shared/segmented';
import { TitleCard } from '../shared/title-card';
import type { Card, Kind } from '../shared/types';
import { useApi } from '../shared/use-api';
import { useDebounced } from '../shared/use-debounced';
import { useLibrary } from '../shared/use-library';

type PersonHit = { id: number; name: string; profile: string | null; dept: string };
type Filter = 'all' | Kind;

const FILTERS = KIND_OPTIONS;

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

function useQuery(): [string, string, (v: string) => void] {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const update = (v: string): void => {
    setQ(v);
    setParams(v ? { q: v } : {}, { replace: true });
  };
  return [q, useDebounced(q.trim()), update];
}

export function SearchPage(): ReactElement {
  const [q, query, setQ] = useQuery();
  const [filter, setFilter] = useState<Filter>('all');
  const path = query ? `/api/tmdb/search?q=${encodeURIComponent(query)}` : null;
  const { data, loading } = useApi<{ results: Card[]; people: PersonHit[] }>(path);
  const { data: lib } = useLibrary();
  const entries = new Map(lib?.titles.map((t) => [t.id, t.entries]));
  const results = (data?.results ?? []).filter((c) => filter === 'all' || c.kind === filter);
  return (
    <div className="page search">
      <input className="search-input serif" placeholder="Un film, une série, un animé, un acteur…" autoFocus value={q}
        onChange={(e) => setQ(e.target.value)} />
      <div className="row search-filters"><Segmented options={FILTERS} value={filter} onChange={setFilter} /></div>
      {query && data && <People people={data.people} />}
      {query && loading && <p className="faint">Recherche…</p>}
      {query && data && results.length === 0 && <p className="muted">Rien trouvé pour « {query} ».</p>}
      <div className="grid">
        <AnimatePresence mode="popLayout">
          {results.map((c) => <TitleCard key={c.id} {...c} entries={entries.get(c.id)} />)}
        </AnimatePresence>
      </div>
    </div>
  );
}
