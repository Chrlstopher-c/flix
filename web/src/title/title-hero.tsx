/** En-tête de fiche : image en fond, affiche en relief, panneau de verre avec titre et informations clés. */
import gsap from 'gsap';
import { useLayoutEffect, useRef, type ReactElement, type RefObject } from 'react';
import { img } from '../shared/api';
import { useGlass } from '../shared/glass/use-glass';
import { KIND_LABEL } from '../shared/labels';
import { Poster } from '../shared/poster';
import type { Kind } from '../shared/types';
import type { Details } from './tmdb-types';


function facts(d: Details): string[] {
  const year = (d.release_date ?? d.first_air_date ?? '').slice(0, 4);
  const runtime = d.runtime ?? d.episode_run_time?.[0];
  return [
    year,
    runtime ? `${Math.floor(runtime / 60) ? `${Math.floor(runtime / 60)} h ` : ''}${runtime % 60} min` : '',
    d.number_of_seasons ? `${d.number_of_seasons} saison${d.number_of_seasons > 1 ? 's' : ''}` : '',
    d.number_of_episodes ? `${d.number_of_episodes} épisodes` : '',
  ].filter(Boolean);
}

function useHeroMotion(key: number): RefObject<HTMLDivElement | null> {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.th-poster', { y: 30, opacity: 0, duration: 1, ease: 'expo.out' });
      gsap.from('.th-copy > *', { y: 20, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out', delay: 0.05 });
    }, root);
    return () => ctx.revert();
  }, [key]);
  return root;
}

function Facts({ d }: { d: Details }): ReactElement {
  return (
    <div className="th-facts">
      {facts(d).map((f) => <span key={f}>{f}</span>)}
      {d.vote_count > 0 && <span className="th-vote">★ {d.vote_average.toFixed(1)}<small> TMDB</small></span>}
    </div>
  );
}

export function TitleHero({ d, kind }: { d: Details; kind: Kind }): ReactElement {
  const root = useHeroMotion(d.id);
  const panel = useGlass<HTMLDivElement>({ radius: 30, tint: 0.32 });
  const name = d.title ?? d.name ?? '';
  const original = d.original_title ?? d.original_name;
  const bg = d.backdrop_path ? `url(${img(d.backdrop_path, 'w1280')})` : undefined;
  return (
    <div className="th" ref={root}>
      <div className="th-bg" style={{ backgroundImage: bg }} />
      <div className="th-shade" />
      <div className="th-inner">
        <div className="th-poster"><Poster path={d.poster_path} size="w500" alt={name} /></div>
        <div className="th-copy" ref={panel}>
          <div className="eyebrow">{[KIND_LABEL[kind], ...d.genres.map((g) => g.name)].join(' · ')}</div>
          <h1 className="glass-text">{name}</h1>
          {original && original !== name && <div className="th-original serif">{original}</div>}
          <Facts d={d} />
          {d.tagline && <p className="th-tagline serif">« {d.tagline} »</p>}
          <p className="th-overview">{d.overview || 'Pas de résumé en français.'}</p>
        </div>
      </div>
    </div>
  );
}
