/** Vignette d'un titre : affiche, nom, année et pastilles de chacun. */
import { motion } from 'framer-motion';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { useSession } from '../auth/session';
import { KIND_LABEL, STATUS_LABEL } from './labels';
import { Poster } from './poster';
import type { Entry, Kind, MediaType } from './types';

type Props = {
  mediaType: MediaType;
  tmdbId: number;
  name: string;
  poster: string | null;
  year: number | null;
  kind: Kind;
  entries?: Entry[];
  hint?: string;
};

export function TitleCard(p: Props): ReactElement {
  const { users } = useSession();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="title-card"
    >
      <Link to={`/titre/${p.mediaType}/${p.tmdbId}`}>
        <div className="title-card-art">
          <Poster path={p.poster} alt={p.name} />
          {p.entries && p.entries.length > 0 && (
            <div className="title-card-dots">
              {p.entries.map((e) => {
                const u = users.find((x) => x.id === e.userId);
                return (
                  <span
                    key={e.userId}
                    title={`${u?.name ?? '?'} · ${STATUS_LABEL[e.status]}`}
                    className="who"
                    style={{ background: u?.color, outlineColor: `var(--st-${e.status})` }}
                  >
                    {u?.name.slice(0, 1)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="title-card-name">{p.name}</div>
        <div className="title-card-meta">{p.hint ?? [KIND_LABEL[p.kind], p.year].filter(Boolean).join(' · ')}</div>
      </Link>
    </motion.div>
  );
}
