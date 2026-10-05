/** Premier lancement : noter des titres connus pour amorcer les recommandations. */
import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { get, send } from '../shared/api';
import type { Card } from '../shared/types';
import { CHOICES, GOAL, type Choice } from './choices';
import { PickCard } from './pick-card';

const PAGE = 30;

/** Liste chargée une seule fois : elle ne doit pas se vider à mesure qu'on répond. */
function useOnboardingCards(): Card[] | undefined {
  const [cards, setCards] = useState<Card[] | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    get<{ results: Card[] }>('/api/taste/onboarding')
      .then((d) => {
        if (alive) setCards(d.results);
      })
      .catch(() => {
        if (alive) setCards([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return cards;
}

function usePicks(): [Map<string, Choice>, (card: Card, c: Choice | null) => void, string | null] {
  const [picks, setPicks] = useState(new Map<string, Choice>());
  const [error, setError] = useState<string | null>(null);
  const chains = useRef(new Map<string, Promise<unknown>>());
  const pick = (card: Card, c: Choice | null): void => {
    const prev = picks.get(card.id);
    setPicks((m) => {
      const n = new Map(m);
      if (c) n.set(card.id, c);
      else n.delete(card.id);
      return n;
    });
    const def = CHOICES.find((x) => x.value === c);
    const path = `/api/library/${card.id}/me`;
    const body = { mediaType: card.mediaType, tmdbId: card.tmdbId, status: def?.status, rating: def?.rating };
    const run = (): Promise<unknown> =>
      !def ? send('DELETE', path, {}) : prev ? send('PUT', path, body) : send('POST', '/api/library', body);
    const req = (chains.current.get(card.id) ?? Promise.resolve()).then(run);
    chains.current.set(
      card.id,
      req.catch(() => undefined),
    );
    req
      .then(() => setError(null))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Enregistrement impossible'));
  };
  return [picks, pick, error];
}

function ProgressBar({ rated, error }: { rated: number; error: string | null }): ReactElement {
  const navigate = useNavigate();
  const finish = async (): Promise<void> => {
    await send('POST', '/api/taste/refresh', {});
    navigate('/');
  };
  return (
    <div className="onboarding-bar">
      <div className="progress">
        <span style={{ width: `${Math.min(100, (rated / GOAL) * 100)}%` }} />
      </div>
      <span className="muted">
        {rated}/{GOAL}
      </span>
      {error && <span className="error">{error}</span>}
      <button className="btn primary" disabled={rated < 3} onClick={finish}>
        Voir mes recommandations
      </button>
    </div>
  );
}

export function OnboardingPage(): ReactElement {
  const data = useOnboardingCards();
  const [picks, pick, error] = usePicks();
  const [shown, setShown] = useState(PAGE);
  const rated = [...picks.values()].filter((c) => c !== 'a_voir').length;
  const cards = data ?? [];
  return (
    <div className="page onboarding">
      <div className="eyebrow">Premier lancement</div>
      <h1>Qu’as-tu déjà vu ?</h1>
      <p className="muted">Réponds sur ce que tu connais, passe le reste. Plus tu en notes, plus c’est juste.</p>
      <div className="grid picks">
        <AnimatePresence>
          {cards.slice(0, shown).map((c) => (
            <PickCard key={c.id} card={c} choice={picks.get(c.id)} onPick={(x) => pick(c, x)} />
          ))}
        </AnimatePresence>
      </div>
      {shown < cards.length && (
        <button className="btn more-picks" onClick={() => setShown(shown + PAGE)}>
          Plus de titres
        </button>
      )}
      <ProgressBar rated={rated} error={error} />
    </div>
  );
}
