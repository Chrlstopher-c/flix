/** Accueil : ce qu'on regarde, ce qu'on veut voir, et ce qui se fait en ce moment. */
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { useSession } from '../auth/session';
import { KIND_PLURAL } from '../shared/labels';
import { Rail, RailSkeleton } from '../shared/rail';
import { TitleCard } from '../shared/title-card';
import type { Card, Kind, LibraryTitle } from '../shared/types';
import { useApi } from '../shared/use-api';
import { useLibrary } from '../shared/use-library';
import { Hero } from './hero';

function LibraryRail({
  title,
  eyebrow,
  items,
}: {
  title: string;
  eyebrow?: string;
  items: LibraryTitle[];
}): ReactElement | null {
  if (!items.length) return null;
  return (
    <Rail
      title={title}
      eyebrow={eyebrow}
      action={
        <Link className="btn small ghost" to="/bibliotheque">
          Tout voir
        </Link>
      }
    >
      {items.map((t) => (
        <TitleCard key={t.id} {...t} entries={t.entries} />
      ))}
    </Rail>
  );
}

function DiscoverRail({ kind }: { kind: Kind }): ReactElement {
  const { data } = useApi<{ results: Card[] }>(`/api/tmdb/discover/${kind}`);
  return (
    <Rail title={KIND_PLURAL[kind]} eyebrow="Populaires en ce moment">
      {data ? data.results.map((c) => <TitleCard key={c.id} {...c} />) : <RailSkeleton />}
    </Rail>
  );
}

export function HomePage(): ReactElement {
  const { me, users } = useSession();
  const other = users.find((u) => u.id !== me.id);
  const { data: lib } = useLibrary();
  const { data: trending } = useApi<{ results: Card[] }>('/api/tmdb/trending');
  const titles = lib?.titles ?? [];
  const mine = (s: string) => titles.filter((t) => t.entries.some((e) => e.userId === me.id && e.status === s));
  const together = titles.filter((t) => t.entries.length > 1 && t.entries.every((e) => e.status === 'a_voir'));
  const fromOther = other
    ? titles.filter((t) => t.entries.some((e) => e.userId === other.id) && !t.entries.some((e) => e.userId === me.id))
    : [];
  const featured = trending?.results.find((c) => c.backdrop);

  return (
    <>
      {featured ? <Hero card={featured} eyebrow="Tendance de la semaine" /> : <div className="hero skeleton" />}
      <div className="page home">
        <LibraryRail title="Je reprends" eyebrow={`Bonsoir ${me.name}`} items={mine('en_cours')} />
        <LibraryRail title="À voir ensemble" items={together} />
        <LibraryRail title="Ma liste" items={mine('a_voir')} />
        {other && <LibraryRail title={`Dans la liste de ${other.name}`} items={fromOther} />}
        {titles.length === 0 && lib && (
          <div className="card empty-home">
            <h2>Votre bibliothèque est vide.</h2>
            <p className="muted">
              Cherche un premier titre avec <kbd>/</kbd> et ajoute-le à ta liste.
            </p>
            <Link className="btn primary" to="/recherche">
              Chercher un titre
            </Link>
          </div>
        )}
        <DiscoverRail kind="film" />
        <DiscoverRail kind="serie" />
        <DiscoverRail kind="anime" />
      </div>
    </>
  );
}
