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

function StopInput({ initial, onSave }: { initial: string; onSave: (text: string) => void }): ReactElement {
  const [text, setText] = useState(initial);
  return (
    <span className="row">
      <input className="field time small" autoFocus placeholder="mm:ss" value={text}
        onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSave(text)} />
      <button className="btn small" onClick={() => onSave(text)}>OK</button>
    </span>
  );
}

function Actions({ season, ep, t, here, onMoment }: ActionProps): ReactElement {
  const [editing, setEditing] = useState(false);
  const episode = ep.episode_number;
  const save = (text: string): void => {
    void t.act('PUT', 'checkpoint', { season, episode, atSeconds: parseTime(text) });
    setEditing(false);
  };
  const upTo = (): void => void t.act('POST', 'episodes', { season, episode, upTo: true });
  return (
    <div className="row ep-actions">
      {editing ? <StopInput initial={formatTime(here?.atSeconds ?? null)} onSave={save} />
        : <button className="btn small ghost" onClick={() => setEditing(true)}>Je m'arrête ici</button>}
      <button className="btn small ghost" onClick={onMoment}>+ Moment</button>
      <button className="btn small ghost" onClick={upTo}>Vu jusqu'ici</button>
    </div>
  );
}

const CHECK = (
  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
);

type SeenProps = { ids: number[]; mine: boolean; tracked: boolean; toggle: () => void };

function SeenBy({ ids, mine, tracked, toggle }: SeenProps): ReactElement {
  const { me, users } = useSession();
  return (
    <div className="ep-seen">
      {users.filter((u) => u.id !== me.id && ids.includes(u.id)).map((u) => (
        <span key={u.id} className="who" title={`Vu par ${u.name}`}
          style={{ background: u.color, outlineColor: 'transparent' }}>
          {u.name.slice(0, 1)}
        </span>
      ))}
      {tracked && (
        <button className={mine ? 'check on' : 'check'} onClick={toggle}
          aria-label={mine ? 'Marquer non vu' : 'Marquer vu'}>
          <svg viewBox="0 0 24 24" width="16" height="16">{CHECK}</svg>
        </button>
      )}
    </div>
  );
}

function meta(ep: Episode, notes: number): string {
  const opts = { day: 'numeric', month: 'short', year: 'numeric' } as const;
  const date = ep.air_date && new Date(ep.air_date).toLocaleDateString('fr-FR', opts);
  const count = notes && `${notes} note${notes > 1 ? 's' : ''}`;
  return [date, ep.runtime && `${ep.runtime} min`, count].filter(Boolean).join(' · ');
}

export function EpisodeRow({ season, ep, t, tracked, onMoment }: Props): ReactElement {
  const { me } = useSession();
  type At = { season: number | null; episode: number | null };
  const same = (x: At): boolean => x.season === season && x.episode === ep.episode_number;
  const ids = (t.state?.watched ?? []).filter(same).map((w) => w.userId);
  const mine = ids.includes(me.id);
  const cp = t.state?.checkpoints.find((c) => c.userId === me.id);
  const here = cp && same(cp) ? cp : null;
  const notes = (t.state?.notes ?? []).filter(same).length;
  const toggle = (): void => void t.act('POST', 'episodes', { season, episode: ep.episode_number, watched: !mine });
  return (
    <div className={`episode${mine ? ' seen' : ''}${here ? ' here' : ''}`}>
      <div className="ep-still"><Poster path={ep.still_path} size="w342" alt={ep.name} ratio="16 / 9" /></div>
      <div className="ep-body">
        <div className="ep-title"><span className="faint">É{ep.episode_number}</span> {ep.name}</div>
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
