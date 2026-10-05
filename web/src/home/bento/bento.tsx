/** Grille bento de l'accueil : une information forte par tuile, sur le sol neumorphique. */
import type { ReactElement } from 'react';
import { useSession } from '../../auth/session';
import { useApi } from '../../shared/use-api';
import { ResumeTile, TonightTile } from './tiles-main';
import { MomentTile, NextTile, OtherTile, TasteTile, WeekTile } from './tiles-small';
import type { Dashboard } from './types';

export function Bento({ partner }: { partner: number | null }): ReactElement {
  const { me, users } = useSession();
  const { data } = useApi<Dashboard>(`/api/dashboard${partner ? `?with=${partner}` : ''}`);
  const other = users.find((u) => u.id === data?.other?.userId) ?? users.find((u) => u.id !== me.id);
  const duoWith = users.find((u) => u.id === data?.partnerId);
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
      <TonightTile rec={data.tonight} partner={duoWith} />
      <WeekTile w={data.week} />
      {other && <OtherTile d={data} other={other} />}
      <TasteTile taste={data.taste} />
      <MomentTile m={data.moment} users={users} />
      <NextTile n={data.next} titles={data.titles} />
    </section>
  );
}
