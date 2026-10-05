/** Découverte sans fin : rangées qui se rallongent et fil vertical qui ne s'arrête pas. */
import { useCallback, type ReactElement } from 'react';
import { useSession } from '../auth/session';
import { get } from '../shared/api';
import { KIND_PLURAL } from '../shared/labels';
import { Rail, RailSkeleton } from '../shared/rail';
import { TitleCard } from '../shared/title-card';
import type { Card, Kind } from '../shared/types';
import { useInfinite } from '../shared/use-infinite';
import { useLibrary } from '../shared/use-library';

const KINDS: Kind[] = ['film', 'serie', 'anime'];

function discoverPage(kind: Kind, page: number): Promise<Card[]> {
  return get<{ results: Card[] }>(`/api/tmdb/discover/${kind}?page=${page}`).then((d) => d.results);
}

export function DiscoverRail({ kind }: { kind: Kind }): ReactElement {
  const load = useCallback((page: number) => discoverPage(kind, page), [kind]);
  const { items, sentinel, done } = useInfinite(load);
  return (
    <Rail title={KIND_PLURAL[kind]} eyebrow="Populaires en ce moment">
      {items.map((c) => <TitleCard key={c.id} {...c} />)}
      {!done && <div ref={sentinel} className="rail-more"><RailSkeleton count={items.length ? 2 : 8} /></div>}
    </Rail>
  );
}

/** Fil d'en bas : films, séries et animés en alternance, sans ce que j'ai déjà dans ma liste. */
export function EndlessFeed(): ReactElement {
  const { me } = useSession();
  const { data: lib } = useLibrary();
  const mine = new Set(lib?.titles.filter((t) => t.entries.some((e) => e.userId === me.id)).map((t) => t.id));
  const load = useCallback(async (page: number) => {
    const pages = await Promise.all(KINDS.map((k) => discoverPage(k, page + 1)));
    const out: Card[] = [];
    for (let i = 0; pages.some((p) => i < p.length); i++) for (const p of pages) if (p[i]) out.push(p[i] as Card);
    return out;
  }, []);
  const { items, sentinel, done } = useInfinite(load);
  return (
    <section className="section">
      <div className="section-head"><div><div className="eyebrow">Sans fin</div><h2>Encore à découvrir</h2></div></div>
      <div className="grid">
        {items.filter((c) => !mine.has(c.id)).map((c) => <TitleCard key={c.id} {...c} />)}
      </div>
      {!done && <div ref={sentinel} className="feed-more"><span className="spinner" /></div>}
    </section>
  );
}
