/** Fiche complète d'un titre : infos, notre suivi, langues, épisodes, notes, distribution. */
import { useState, type ReactElement } from 'react';
import { useParams } from 'react-router';
import { useSession } from '../auth/session';
import { toKind } from '../shared/kind';
import { Rail } from '../shared/rail';
import { TitleCard } from '../shared/title-card';
import type { Card, MediaType } from '../shared/types';
import { useApi } from '../shared/use-api';
import { CastRail } from './cast-rail';
import { MovieCheckpoint } from './checkpoint';
import { LanguagesPanel, translationLangs } from './languages-panel';
import { MyEntry } from './my-entry';
import { NotesPanel } from './notes-panel';
import { SeasonsPanel, type Draft } from './seasons-panel';
import { TitleHero } from './title-hero';
import type { Details } from './tmdb-types';
import { SuggestPanel } from './suggest-panel';
import { useTitleState } from './use-title-state';

function Recommendations({ d, type }: { d: Details; type: MediaType }): ReactElement | null {
  const recs = (d.recommendations?.results ?? []).map((r) => toKind(r, type)).filter((c): c is Card => c !== null);
  if (!recs.length) return null;
  return (
    <Rail title="Dans la même veine">
      {recs.slice(0, 16).map((c) => (
        <TitleCard key={c.id} {...c} />
      ))}
    </Rail>
  );
}

function Body({ d, type, id }: { d: Details; type: MediaType; id: number }): ReactElement {
  const { me } = useSession();
  const t = useTitleState(type, id);
  const [draft, setDraft] = useState<Draft>(null);
  const kind = toKind({ ...d, genre_ids: d.genres.map((g) => g.id), media_type: type }, type)?.kind ?? 'film';
  const isTv = type === 'tv';
  return (
    <>
      <TitleHero d={d} kind={kind} />
      <div className="page title-page">
        <section className="card entry-card">
          <MyEntry t={t} original={d.original_language} available={translationLangs(d)} />
          <SuggestPanel
            mediaType={type}
            tmdbId={id}
            inMyList={Boolean(t.state?.entries.some((e) => e.userId === me.id))}
            onAccepted={() => void t.add('a_voir')}
          />
        </section>
        {isTv ? <SeasonsPanel d={d} t={t} onMoment={setDraft} /> : <MovieCheckpoint t={t} />}
        <NotesPanel
          t={t}
          isTv={isTv}
          original={d.original_language}
          draft={draft}
          clearDraft={() => setDraft(null)}
        />
        <LanguagesPanel d={d} />
        <CastRail d={d} />
        <Recommendations d={d} type={type} />
      </div>
    </>
  );
}

export function TitlePage(): ReactElement {
  const params = useParams();
  const type: MediaType = params.type === 'tv' ? 'tv' : 'movie';
  const id = Number(params.id);
  const { data, error } = useApi<Details>(`/api/tmdb/title/${type}/${id}`);
  if (error)
    return (
      <div className="page">
        <p className="error">{error}</p>
      </div>
    );
  if (!data) return <div className="th skeleton" />;
  return <Body key={`${type}:${id}`} d={data} type={type} id={id} />;
}
