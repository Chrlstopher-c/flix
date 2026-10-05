/** Grande bannière d'accueil : l'image est le sol, le panneau de verre flotte dessus. */
import gsap from 'gsap';
import { useLayoutEffect, useRef, type ReactElement } from 'react';
import { Link } from 'react-router';
import { img } from '../shared/api';
import { useGlass } from '../shared/glass/use-glass';
import { KIND_LABEL } from '../shared/labels';
import type { Card } from '../shared/types';

export function Hero({ card, eyebrow }: { card: Card; eyebrow: string }): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const panel = useGlass<HTMLDivElement>({ radius: 30, tint: 0.32 });
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-panel > *', { y: 20, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' });
    }, root);
    return () => ctx.revert();
  }, [card.id]);

  return (
    <div className="hero" ref={root}>
      <img className="hero-bg" src={img(card.backdrop, 'w1280')} alt="" />
      <div className="hero-shade" />
      <div className="hero-panel" ref={panel}>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="glass-text">{card.name}</h1>
        <p className="hero-overview">{card.overview}</p>
        <div className="row">
          <Link className="btn primary" to={`/titre/${card.mediaType}/${card.tmdbId}`}>Voir la fiche</Link>
          <span className="hero-meta">{[KIND_LABEL[card.kind], card.year].filter(Boolean).join(' · ')}</span>
        </div>
      </div>
    </div>
  );
}
