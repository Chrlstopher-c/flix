/** Image TMDB : fondu à l'arrivée, jamais de trou blanc. */
import { useState, type ReactElement } from 'react';
import { img } from './api';

type Props = { path: string | null | undefined; size?: string; alt: string; className?: string; ratio?: string };

export function Poster({ path, size = 'w342', alt, className, ratio = '2 / 3' }: Props): ReactElement {
  const [loaded, setLoaded] = useState(false);
  const src = img(path, size);
  return (
    <div className={`poster ${className ?? ''}`} style={{ aspectRatio: ratio }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      ) : (
        <span className="poster-empty serif">{alt.slice(0, 1)}</span>
      )}
    </div>
  );
}
