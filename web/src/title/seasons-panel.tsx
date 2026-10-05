/** Saisons et épisodes : cocher, reprendre, marquer un moment. */
import { useState, type ReactElement } from 'react';
import { useSession } from '../auth/session';
import { formatTime } from '../shared/labels';
import { useApi } from '../shared/use-api';
import { EpisodeRow } from './episode-row';
import type { Details, Episode, Season, SeasonSummary } from './tmdb-types';
import type { TitleActions } from './use-title-state';

export type Draft = { season: number | null; episode: number | null; nonce: number } | null;

function Progress({ t }: { t: TitleActions }): ReactElement | null {
  const { users } = useSession();
  const cps = t.state?.checkpoints.filter((c) => c.episode !== null) ?? [];
  if (!cps.length) return null;
  return (
    <div className="row progress-line">
      {cps.map((c) => {
        const u = users.find((x) => x.id === c.userId);
        return (
          <span key={c.userId} className="chip">
            <span className="dot" style={{ background: u?.color }} />
            {u?.name} en est à S{c.season} É{c.episode}
            {c.atSeconds !== null ? ` · ${formatTime(c.atSeconds)}` : ''}
          </span>
        );
      })}
    </div>
  );
}

function SeasonTabs({
  seasons,
  n,
  setN,
  t,
}: {
  seasons: SeasonSummary[];
  n: number;
  setN: (n: number) => void;
  t: TitleActions;
}): ReactElement {
  const { me } = useSession();
  const seen = (s: number): number =>
    t.state?.watched.filter((w) => w.userId === me.id && w.season === s).length ?? 0;
  return (
    <div className="scroller season-tabs">
      {seasons.map((s) => (
        <button
          key={s.season_number}
          className={s.season_number === n ? 'chip on' : 'chip'}
          onClick={() => setN(s.season_number)}
        >
          {s.season_number === 0 ? 'Hors-série' : `Saison ${s.season_number}`}
          <span className="faint">
            {seen(s.season_number)}/{s.episode_count}
          </span>
        </button>
      ))}
    </div>
  );
}

const WINDOW = 6;

/** Fenêtre de quelques épisodes centrée sur le point d'arrêt, pour ne pas noyer la page. */
function visible(eps: Episode[], all: boolean, at: number | null): Episode[] {
  if (all || eps.length <= WINDOW) return eps;
  const idx = Math.max(
    0,
    eps.findIndex((e) => e.episode_number === at),
  );
  const start = Math.min(Math.max(0, idx - 1), eps.length - WINDOW);
  return eps.slice(start, start + WINDOW);
}

type PanelProps = { d: Details; t: TitleActions; onMoment: (dr: Draft) => void };
type ListProps = PanelProps & { n: number; tracked: boolean; at: number | null };

function EpisodeList({ d, t, n, tracked, at, onMoment }: ListProps): ReactElement {
  const [all, setAll] = useState(false);
  const { data } = useApi<Season>(`/api/tmdb/season/${d.id}/${n}`);
  const ready = data?.season_number === n;
  return (
    <>
      <div className="episodes">
        {ready ? visible(data.episodes, all, at).map((e) => (
          <EpisodeRow key={e.episode_number} season={n} ep={e} t={t} tracked={tracked}
            onMoment={() => onMoment({ season: n, episode: e.episode_number, nonce: Date.now() })} />
        )) : Array.from({ length: 4 }, (_, i) => <div key={i} className="episode skeleton" style={{ height: 96 }} />)}
      </div>
      {ready && data.episodes.length > WINDOW && (
        <button className="btn small ghost more" onClick={() => setAll(!all)}>
          {all ? 'Replier' : `Afficher les ${data.episodes.length} épisodes`}
        </button>
      )}
    </>
  );
}

export function SeasonsPanel({ d, t, onMoment }: PanelProps): ReactElement | null {
  const { me } = useSession();
  const seasons = (d.seasons ?? []).filter((s) => s.episode_count > 0);
  const cp = t.state?.checkpoints.find((c) => c.userId === me.id);
  const first = seasons.find((s) => s.season_number === (cp?.season ?? 1)) ?? seasons.find((s) => s.season_number > 0);
  const [n, setN] = useState(first?.season_number ?? seasons[0]?.season_number ?? 1);
  if (!seasons.length) return null;
  const tracked = Boolean(t.state?.entries.some((e) => e.userId === me.id));
  return (
    <section className="section seasons">
      <div className="section-head"><h2>Épisodes</h2><Progress t={t} /></div>
      <SeasonTabs seasons={seasons} n={n} setN={setN} t={t} />
      {!tracked && <p className="faint">Ajoute le titre à ta liste pour cocher les épisodes.</p>}
      <EpisodeList key={n} d={d} t={t} n={n} tracked={tracked} at={cp?.season === n ? cp.episode : null}
        onMoment={onMoment} />
    </section>
  );
}
