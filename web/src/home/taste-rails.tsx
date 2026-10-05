/** Rangées personnalisées : pour moi, pour nous deux, parce que j'ai aimé X. */
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
import { useSession } from '../auth/session';
import { Rail } from '../shared/rail';
import { Segmented } from '../shared/segmented';
import { TitleCard } from '../shared/title-card';
import type { Rec, TasteHome } from '../shared/types';

type RailProps = { title: string; eyebrow?: string; items: Rec[]; action?: ReactNode };

function RecRail({ title, eyebrow, items, action }: RailProps): ReactElement | null {
  if (!items.length) return null;
  return (
    <Rail title={title} eyebrow={eyebrow} width={170} action={action}>
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
          Note une quinzaine de titres connus : Flix te proposera ensuite ce qui te ressemble, et ce qui vous
          ressemble avec chacun de tes amis.
        </p>
      </div>
      <Link className="btn primary" to="/decouverte">
        Commencer
      </Link>
    </div>
  );
}

/** « Pour toi et … » : un sélecteur quand il y a plusieurs personnes avec qui faire un duo. */
function DuoRail({ taste, setPartner }: { taste: TasteHome; setPartner: (id: number) => void }): ReactElement | null {
  const { users, me } = useSession();
  const others = users.filter((u) => u.id !== me.id);
  const partner = others.find((u) => u.id === taste.partnerId) ?? others[0];
  if (!partner) return null;
  const picker = others.length > 1 && (
    <Segmented
      options={others.map((u) => ({ value: String(u.id), label: u.name, color: u.color }))}
      value={String(partner.id)}
      onChange={(v) => setPartner(Number(v))}
    />
  );
  if (!taste.duo.length) {
    return (
      <section className="section">
        <div className="section-head">
          <h2>Pour toi et {partner.name}</h2>
          {picker}
        </div>
        <p className="faint">
          Les recommandations communes arriveront dès que {partner.name} aura noté quelques titres.
        </p>
      </section>
    );
  }
  return (
    <RecRail
      title={`Pour toi et ${partner.name}`}
      eyebrow="Vos goûts communs"
      items={taste.duo}
      action={picker || undefined}
    />
  );
}

export function TasteRails({
  taste,
  setPartner,
}: {
  taste: TasteHome;
  setPartner: (id: number) => void;
}): ReactElement {
  return (
    <>
      {taste.needsOnboarding && <Onboarding rated={taste.rated} computing={taste.computing} />}
      <RecRail title="Pour toi" eyebrow="Selon tes goûts" items={taste.forYou} />
      {!taste.needsOnboarding && <DuoRail taste={taste} setPartner={setPartner} />}
      {taste.because.map((b) => (
        <RecRail key={b.id} title={`Parce que tu as aimé ${b.name}`} items={b.items} />
      ))}
    </>
  );
}
