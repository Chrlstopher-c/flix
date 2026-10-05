/** Grille bento de l'accueil : une information forte par tuile, sur le sol neumorphique. */
import type { ReactElement } from 'react';
import { useSession } from '../../auth/session';
import { useApi } from '../../shared/use-api';
import { ResumeTile, TonightTile } from './tiles-main';
import { MomentTile, NextTile, OtherTile, TasteTile, WeekTile } from './tiles-small';
import type { Dashboard } from './types';

export function Bento(): ReactElement {
  const { me, users } = useSession();
  const { data } = useApi<Dashboard>('/api/dashboard');
  const other = users.find((u) => u.id !== me.id);
  if (!data)
    return (
      <section className="bento">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="tile skeleton" />
        ))}
      </section>
    );
  return (
    <section className="bento" aria-label="Tableau de bord">
      <ResumeTile r={data.resume} />
      <TonightTile rec={data.tonight} />
      <WeekTile w={data.week} />
      {other && <OtherTile d={data} other={other} />}
      <TasteTile taste={data.taste} />
      <MomentTile m={data.moment} users={users} />
      <NextTile n={data.next} titles={data.titles} />
    </section>
  );
}
