/** Bibliothèque commune avec filtres combinables. */
import { AnimatePresence } from 'framer-motion';
import { useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import { useSession } from '../auth/session';
import { TitleCard } from '../shared/title-card';
import { useLibrary } from '../shared/use-library';
import { applyFilters, DEFAULT_FILTERS, type Filters } from './filters';
import { LibraryToolbar } from './library-toolbar';

function loadFilters(): Filters {
  try {
    return { ...DEFAULT_FILTERS, ...(JSON.parse(sessionStorage.getItem('ft-filters') ?? '{}') as Partial<Filters>) }; // posé par saveFilters
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function LibraryPage(): ReactElement {
  const { me } = useSession();
  const { data } = useLibrary();
  const [filters, setFilters] = useState<Filters>(loadFilters);
  const update = (f: Filters): void => {
    setFilters(f);
    try {
      sessionStorage.setItem('ft-filters', JSON.stringify(f));
    } catch {
      /* filtres non mémorisés */
    }
  };
  const titles = useMemo(() => applyFilters(data?.titles ?? [], filters, me.id), [data, filters, me.id]);

  return (
    <div className="page library">
      <div className="section-head">
        <div>
          <div className="eyebrow">{data ? `${titles.length} sur ${data.titles.length}` : '…'}</div>
          <h1>Bibliothèque</h1>
        </div>
        <Link to="/recherche" className="btn primary">
          Ajouter
        </Link>
      </div>
      <LibraryToolbar filters={filters} onChange={update} titles={data?.titles ?? []} tags={data?.tags ?? []} />
      {data && titles.length === 0 && <p className="muted empty">Aucun titre ne correspond à ces filtres.</p>}
      <div className="grid">
        <AnimatePresence mode="popLayout">
          {titles.map((t) => (
            <TitleCard key={t.id} {...t} entries={t.entries} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
