/** Un épisode : vu par qui, point d'arrêt, moments. */
import { useState, type ReactElement } from 'react';
import { useSession } from '../auth/session';
import { formatTime, parseTime } from '../shared/labels';
import { Poster } from '../shared/poster';
import type { Checkpoint } from '../shared/types';
import type { Episode } from './tmdb-types';
import type { TitleActions } from './use-title-state';

type Props = { season: number; ep: Episode; t: TitleActions; tracked: boolean; onMoment: () => void };
type ActionProps = { season: number; ep: Episode; t: TitleActions; here: Checkpoint | null; onMoment: () => void };

function Actions({ season, ep, t, here, onMoment }: ActionProps): ReactElement {
  const [stopAt, setStopAt] = useState<string | null>(null);
  const saveStop = (): void => {
    void t.act('PUT', 'checkpoint', { season, episode: ep.episode_number, atSeconds: parseTime(stopAt ?? '') });
    setStopAt(null);
  };
  const upTo = (): void => {
    void t.act('POST', 'episodes', { season, episode: ep.episode_number, upTo: true });
  };
  return (
    <div className="row ep-actions">
      {stopAt === null ? (
        <button className="btn small ghost" onClick={() => setStopAt(formatTime(here?.atSeconds ?? null))}>
          Je m'arrête ici
        </button>
      ) : (
        <span className="row">
          <input
            className="field time small"
            autoFocus
            placeholder="mm:ss"
            value={stopAt}
            onChange={(e) => setStopAt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveStop()}
          />
          <button className="btn small" onClick={saveStop}>
            OK
          </button>
        </span>
      )}
      <button className="btn small ghost" onClick={onMoment}>
        + Moment
      </button>
      <button className="btn small ghost" onClick={upTo}>
        Vu jusqu'ici
      </button>
    </div>
  );
}

function SeenBy({
  ids,
  mine,
  tracked,
  toggle,
}: {
  ids: number[];
  mine: boolean;
  tracked: boolean;
  toggle: () => void;
}): ReactElement {
  const { me, users } = useSession();
  return (
    <div className="ep-seen">
      {users
        .filter((u) => u.id !== me.id && ids.includes(u.id))
        .map((u) => (
          <span
            key={u.id}
            className="who"
            title={`Vu par ${u.name}`}
            style={{ background: u.color, outlineColor: 'transparent' }}
          >
            {u.name.slice(0, 1)}
          </span>
        ))}
      {tracked && (
        <button
          className={mine ? 'check on' : 'check'}
          onClick={toggle}
          aria-label={mine ? 'Marquer non vu' : 'Marquer vu'}
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

function meta(ep: Episode, notes: number): string {
  const date =
    ep.air_date &&
    new Date(ep.air_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return [date, ep.runtime && `${ep.runtime} min`, notes && `${notes} note${notes > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(' · ');
}

export function EpisodeRow({ season, ep, t, tracked, onMoment }: Props): ReactElement {
  const { me } = useSession();
  const ids = (t.state?.watched ?? [])
    .filter((w) => w.season === season && w.episode === ep.episode_number)
    .map((w) => w.userId);
  const mine = ids.includes(me.id);
  const cp = t.state?.checkpoints.find((c) => c.userId === me.id);
  const here = cp?.season === season && cp.episode === ep.episode_number ? cp : null;
  const notes = (t.state?.notes ?? []).filter((n) => n.season === season && n.episode === ep.episode_number).length;
  const toggle = (): void => {
    void t.act('POST', 'episodes', { season, episode: ep.episode_number, watched: !mine });
  };
  return (
    <div className={`episode${mine ? ' seen' : ''}${here ? ' here' : ''}`}>
      <div className="ep-still">
        <Poster path={ep.still_path} size="w342" alt={ep.name} ratio="16 / 9" />
      </div>
      <div className="ep-body">
        <div className="ep-title">
          <span className="faint">É{ep.episode_number}</span> {ep.name}
        </div>
        <div className="ep-meta faint">
          {meta(ep, notes)}
          {here && (
            <span className="here-badge">
              Arrêté ici{here.atSeconds !== null ? ` · ${formatTime(here.atSeconds)}` : ''}
            </span>
          )}
        </div>
        <p className="ep-overview muted">{ep.overview}</p>
        {tracked && <Actions season={season} ep={ep} t={t} here={here} onMoment={onMoment} />}
      </div>
      <SeenBy ids={ids} mine={mine} tracked={tracked} toggle={toggle} />
    </div>
  );
}
