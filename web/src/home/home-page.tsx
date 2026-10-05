/** Accueil : ce qu'on regarde, ce qu'on veut voir, et ce qui se fait en ce moment. */
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { useSession } from '../auth/session';
import { Rail } from '../shared/rail';
import { TitleCard } from '../shared/title-card';
import type { Card, LibraryTitle } from '../shared/types';
import { useApi } from '../shared/use-api';
import { useLibrary } from '../shared/use-library';
import { usePartner } from '../shared/use-partner';
import { Bento } from './bento/bento';
import './bento/bento.css';
import { DiscoverRail, EndlessFeed } from './discover';
import { Hero } from './hero';
import { SuggestionsRail } from './suggestions-rail';
import { TasteRails } from './taste-rails';
import { useTaste } from './use-taste';

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

function greeting(name: string): string {
  const h = new Date().getHours();
  return `${h >= 18 || h < 5 ? 'Bonsoir' : 'Bonjour'} ${name}`;
}

function EmptyHome(): ReactElement {
  return (
    <div className="card empty-home">
      <h2>Votre bibliothèque est vide.</h2>
      <p className="muted">
        Cherche un premier titre avec <kbd>/</kbd> et ajoute-le à ta liste.
      </p>
      <Link className="btn primary" to="/recherche">
        Chercher un titre
      </Link>
    </div>
  );
}

function OurRails({ titles }: { titles: LibraryTitle[] }): ReactElement {
  const { me, users } = useSession();
  const others = users.filter((u) => u.id !== me.id).slice(0, 4);
  const has = (t: LibraryTitle, id: number): boolean => t.entries.some((e) => e.userId === id);
  const mine = (s: string): LibraryTitle[] =>
    titles.filter((t) => t.entries.some((e) => e.userId === me.id && e.status === s));
  const together = titles.filter((t) => t.entries.length > 1 && t.entries.every((e) => e.status === 'a_voir'));
  return (
    <>
      <LibraryRail title="Je reprends" eyebrow={greeting(me.name)} items={mine('en_cours')} />
      <LibraryRail title="À voir ensemble" items={together} />
      <LibraryRail title="Ma liste" items={mine('a_voir')} />
      {others.map((o) => (
        <LibraryRail
          key={o.id}
          title={`Dans la liste de ${o.name}`}
          items={titles.filter((t) => has(t, o.id) && !has(t, me.id))}
        />
      ))}
    </>
  );
}

export function HomePage(): ReactElement {
  const { data: lib } = useLibrary();
  const [partner, setPartner] = usePartner();
  const taste = useTaste(partner);
  const { data: trending } = useApi<{ results: Card[] }>('/api/tmdb/trending');
  const mine = taste?.forYou.find((c) => c.backdrop);
  const featured = mine ?? trending?.results.find((c) => c.backdrop);
  return (
    <>
      {featured ? (
        <Hero card={featured} eyebrow={mine ? 'Choisi pour toi' : 'Tendance de la semaine'} />
      ) : (
        <div className="hero skeleton" />
      )}
      <div className="page home">
        <Bento partner={partner} />
        <SuggestionsRail />
        <OurRails titles={lib?.titles ?? []} />
        {taste && <TasteRails taste={taste} setPartner={setPartner} />}
        {lib && lib.titles.length === 0 && !taste?.needsOnboarding && <EmptyHome />}
        <DiscoverRail kind="film" />
        <DiscoverRail kind="serie" />
        <DiscoverRail kind="anime" />
        <EndlessFeed />
      </div>
    </>
  );
}
