/** Fiche complète d'un titre : infos, notre suivi, langues, épisodes, notes, distribution. */
import { useState, type ReactElement } from 'react';
import { useParams } from 'react-router';
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

export function TitlePage(): ReactElement {
  const params = useParams();
  const type: MediaType = params.type === 'tv' ? 'tv' : 'movie';
  const id = Number(params.id);
  const { data: d, error } = useApi<Details>(`/api/tmdb/title/${type}/${id}`);
  const t = useTitleState(type, id);
  const [draft, setDraft] = useState<Draft>(null);
  if (error)
    return (
      <div className="page">
        <p className="error">{error}</p>
      </div>
    );
  if (!d) return <div className="th skeleton" />;
  const kind = toKind({ ...d, genre_ids: d.genres.map((g) => g.id), media_type: type }, type)?.kind ?? 'film';

  return (
    <>
      <TitleHero d={d} kind={kind}>
        <MyEntry t={t} original={d.original_language} available={translationLangs(d)} />
      </TitleHero>
      <div className="page title-page">
        {type === 'tv' ? <SeasonsPanel d={d} t={t} onMoment={setDraft} /> : <MovieCheckpoint t={t} />}
        <NotesPanel
          t={t}
          isTv={type === 'tv'}
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
