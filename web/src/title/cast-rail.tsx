/** Distribution principale, chaque visage mène à sa filmographie. */
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { Poster } from '../shared/poster';
import type { Details } from './tmdb-types';

type CastLine = { id: number; name: string; profile_path: string | null; role: string };

function castOf(d: Details): CastLine[] {
  if (d.aggregate_credits?.cast.length) {
    return d.aggregate_credits.cast.slice(0, 20).map((c) => ({
      id: c.id,
      name: c.name,
      profile_path: c.profile_path,
      role: `${c.roles[0]?.character ?? ''}${c.total_episode_count ? ` · ${c.total_episode_count} ép.` : ''}`,
    }));
  }
  return (d.credits?.cast ?? [])
    .slice(0, 20)
    .map((c) => ({ id: c.id, name: c.name, profile_path: c.profile_path, role: c.character ?? '' }));
}

export function CastRail({ d }: { d: Details }): ReactElement | null {
  const cast = castOf(d);
  const crew = (d.credits?.crew ?? []).filter((c) => c.job === 'Director' || c.job === 'Screenplay').slice(0, 4);
  const creators = d.created_by ?? [];
  if (!cast.length) return null;
  return (
    <section className="section">
      <div className="section-head">
        <h2>Distribution</h2>
        <div className="faint small">
          {[
            ...creators.map((c) => ({ id: c.id, name: c.name, job: 'Création' })),
            ...crew.map((c) => ({ id: c.id, name: c.name, job: c.job === 'Director' ? 'Réalisation' : 'Scénario' })),
          ].map((c, i) => (
            <span key={`${c.id}-${i}`}>
              {i ? ' · ' : ''}
              {c.job}{' '}
              <Link className="link" to={`/personne/${c.id}`}>
                {c.name}
              </Link>
            </span>
          ))}
        </div>
      </div>
      <div className="scroller">
        {cast.map((c) => (
          <Link key={c.id} to={`/personne/${c.id}`} className="cast">
            <Poster path={c.profile_path} size="w185" alt={c.name} />
            <div className="cast-name">{c.name}</div>
            <div className="cast-role">{c.role}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
