/** Petites tuiles : semaine, l'autre, goût du moment, dernier moment, prochaine sortie. */
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import type { User } from '../../shared/types';
import { formatTime } from '../../shared/labels';
import { langName, viewingLabel } from '../../shared/languages';
import { ago, dayLabel, titleLink, type Dashboard } from './types';

export function WeekTile({ w }: { w: Dashboard['week'] }): ReactElement {
  return (
    <article className="tile t-stat">
      <div className="eyebrow">Cette semaine</div>
      <div className="big serif">{w.episodes}</div>
      <p className="faint">
        épisode{w.episodes > 1 ? 's' : ''} · {w.films} film{w.films > 1 ? 's' : ''}
      </p>
    </article>
  );
}

export function OtherTile({ d, other }: { d: Dashboard; other: User }): ReactElement {
  const a = d.other;
  const t = a ? d.titles[a.titleId] : undefined;
  const avatar = (
    <span className="who big-who" style={{ background: other.color, outlineColor: 'transparent' }}>
      {other.name.slice(0, 1)}
    </span>
  );
  const body = (
    <>
      <div className="eyebrow">{other.name} regarde</div>
      <div className="row t-bottom">
        {avatar}
        {a && t ? (
          <div>
            <b>{t.name}</b>
            <div className="faint">
              {a.label} · {ago(a.at)}
            </div>
          </div>
        ) : (
          <span className="faint">Rien de récent.</span>
        )}
      </div>
    </>
  );
  return t ? (
    <Link to={titleLink(t)} className="tile t-other">
      {body}
    </Link>
  ) : (
    <article className="tile t-other">{body}</article>
  );
}

export function TasteTile({ taste }: { taste: Dashboard['taste'] }): ReactElement {
  return (
    <article className="tile t-taste">
      <div className="eyebrow">Ton moment</div>
      <h3>{taste.genres.length ? taste.genres.slice(0, 2).join(' et ') : 'Encore à découvrir'}</h3>
      <div className="row t-bottom">
        {taste.genres.map((g) => (
          <span key={g} className="chip on">
            {g}
          </span>
        ))}
        {taste.version && <span className="chip on">{viewingLabel(taste.version)}</span>}
        {!taste.genres.length && (
          <Link className="btn small" to="/decouverte">
            Noter des titres
          </Link>
        )}
      </div>
    </article>
  );
}

export function MomentTile({ m, users }: { m: Dashboard['moment']; users: User[] }): ReactElement {
  if (!m) {
    return (
      <article className="tile t-moment">
        <div className="eyebrow">Dernier moment</div>
        <p className="faint">Marque un passage depuis un épisode : il s’affichera ici.</p>
      </article>
    );
  }
  const u = users.find((x) => x.id === m.userId);
  const where = [
    m.titleName,
    m.season !== null && `S${m.season} É${m.episode}`,
    m.atSeconds !== null && formatTime(m.atSeconds),
    m.language && langName(m.language),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <article className="tile t-moment">
      <div className="eyebrow">Dernier moment</div>
      <p className="t-quote serif">« {m.body} »</p>
      <div className="row t-bottom faint">
        <span className="who" style={{ background: u?.color, outlineColor: 'transparent' }}>
          {u?.name.slice(0, 1)}
        </span>
        {where}
      </div>
    </article>
  );
}

export function NextTile({ n, titles }: { n: Dashboard['next']; titles: Dashboard['titles'] }): ReactElement {
  const t = n ? titles[n.titleId] : undefined;
  const body = (
    <>
      <div className="eyebrow">Prochain épisode</div>
      <div className="big serif">{n ? dayLabel(n.date) : '—'}</div>
      <p className="faint">
        {n ? `${n.name} · S${n.season} É${n.episode}` : 'Aucune sortie annoncée dans tes séries.'}
      </p>
    </>
  );
  return t ? (
    <Link to={titleLink(t)} className="tile t-next">
      {body}
    </Link>
  ) : (
    <article className="tile t-next">{body}</article>
  );
}
