/** Grande bannière d'accueil avec parallaxe au défilement. */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef, type ReactElement } from 'react';
import { Link } from 'react-router';
import { img } from '../shared/api';
import { KIND_LABEL } from '../shared/labels';
import type { Card } from '../shared/types';

gsap.registerPlugin(ScrollTrigger);

export function Hero({ card, eyebrow }: { card: Card; eyebrow: string }): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.hero-bg', {
        yPercent: 18,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.from('.hero-copy > *', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' });
    }, root);
    return () => ctx.revert();
  }, [card.id]);

  return (
    <div className="hero" ref={root}>
      <div className="hero-bg" style={{ backgroundImage: `url(${img(card.backdrop, 'w1280')})` }} />
      <div className="hero-shade" />
      <div className="hero-copy">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{card.name}</h1>
        <p className="muted hero-overview">{card.overview}</p>
        <div className="row">
          <Link className="btn primary" to={`/titre/${card.mediaType}/${card.tmdbId}`}>
            Voir la fiche
          </Link>
          <span className="faint">{[KIND_LABEL[card.kind], card.year].filter(Boolean).join(' · ')}</span>
        </div>
      </div>
    </div>
  );
}
