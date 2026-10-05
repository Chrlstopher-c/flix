/** Grandes tuiles : je reprends, ce soir ensemble. */
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { img } from '../../shared/api';
import { formatTime } from '../../shared/labels';
import { Poster } from '../../shared/poster';
import type { User } from '../../shared/types';
import { titleLink, type Dashboard } from './types';

export function ResumeTile({ r }: { r: Dashboard['resume'] }): ReactElement {
  if (!r) {
    return (
      <article className="tile t-resume empty-tile">
        <div className="eyebrow">Je reprends</div>
        <h3>Rien en cours pour l’instant.</h3>
        <p className="faint">Passe un titre en « En cours » pour le retrouver ici.</p>
        <Link className="btn small" to="/bibliotheque">
          Ma bibliothèque
        </Link>
      </article>
    );
  }
  const where = r.cp?.episode ? `S${r.cp.season} É${r.cp.episode}` : null;
  const stop = r.cp?.atSeconds != null ? `Arrêté à ${formatTime(r.cp.atSeconds)}` : null;
  const pct = r.total ? Math.min(100, (r.watched / r.total) * 100) : null;
  return (
    <Link to={titleLink(r.title)} className="tile t-resume">
      <div className="t-media">{r.title.backdrop && <img src={img(r.title.backdrop, 'w780')} alt="" />}</div>
      <div className="t-body">
        <div className="eyebrow">Je reprends</div>
        <h3>{[r.title.name, where].filter(Boolean).join(' · ')}</h3>
        <p className="faint">
          {[stop, r.total ? `${r.watched} / ${r.total} épisodes` : null].filter(Boolean).join(' · ')}
        </p>
        {pct !== null && (
          <div className="t-progress">
            <span style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}

export function TonightTile({ rec, partner }: { rec: Dashboard['tonight']; partner?: User }): ReactElement {
  const eyebrow = partner ? `Ce soir, avec ${partner.name}` : 'Ce soir, ensemble';
  if (!rec) {
    return (
      <article className="tile t-tonight empty-tile">
        <div className="eyebrow">{eyebrow}</div>
        <p className="faint">Notez quelques titres chacun : le choix commun apparaîtra ici.</p>
      </article>
    );
  }
  return (
    <Link to={titleLink(rec)} className="tile t-tonight">
      <div className="t-poster">
        <Poster path={rec.poster} size="w500" alt={rec.name} />
      </div>
      <div className="eyebrow">{eyebrow}</div>
      <h3>{rec.name}</h3>
      <p className="faint">{rec.reason}</p>
    </Link>
  );
}
