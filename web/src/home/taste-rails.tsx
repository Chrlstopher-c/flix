/** Rangées personnalisées : pour moi, pour nous deux, parce que j'ai aimé X. */
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { useSession } from '../auth/session';
import { Rail } from '../shared/rail';
import { TitleCard } from '../shared/title-card';
import type { Rec, TasteHome } from '../shared/types';

function RecRail({ title, eyebrow, items }: { title: string; eyebrow?: string; items: Rec[] }): ReactElement | null {
  if (!items.length) return null;
  return (
    <Rail title={title} eyebrow={eyebrow} width={170}>
      {items.map((r) => (
        <TitleCard key={r.id} {...r} hint={r.reason} />
      ))}
    </Rail>
  );
}

function Onboarding({ rated, computing }: { rated: number; computing: boolean }): ReactElement {
  return (
    <div className="card onboarding-banner">
      <div className="stack">
        <div className="eyebrow">
          {computing ? 'Calcul en cours…' : `${rated} titre${rated > 1 ? 's' : ''} noté${rated > 1 ? 's' : ''}`}
        </div>
        <h2>Apprends-moi tes goûts.</h2>
        <p className="muted">
          Note une quinzaine de titres connus : FluxTube te proposera ensuite ce qui te ressemble, et ce qui vous
          ressemble à tous les deux.
        </p>
      </div>
      <Link className="btn primary" to="/decouverte">
        Commencer
      </Link>
    </div>
  );
}

export function TasteRails({ taste }: { taste: TasteHome }): ReactElement {
  const { users, me } = useSession();
  const other = users.find((u) => u.id !== me.id);
  return (
    <>
      {taste.needsOnboarding && <Onboarding rated={taste.rated} computing={taste.computing} />}
      <RecRail title="Pour toi" eyebrow="Selon tes goûts" items={taste.forYou} />
      {other && <RecRail title={`Pour toi et ${other.name}`} eyebrow="Vos goûts communs" items={taste.duo} />}
      {other && !taste.duo.length && !taste.needsOnboarding && (
        <p className="faint duo-wait">
          Les recommandations pour toi et {other.name} arriveront dès que {other.name} aura noté quelques titres.
        </p>
      )}
      {taste.because.map((b) => (
        <RecRail key={b.id} title={`Parce que tu as aimé ${b.name}`} items={b.items} />
      ))}
    </>
  );
}
