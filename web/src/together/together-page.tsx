/** « Ensemble » : choisir avec qui regarder, et obtenir les recommandations de ce groupe. */
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState, type ReactElement } from 'react';
import { useSession } from '../auth/session';
import { get } from '../shared/api';
import { TitleCard } from '../shared/title-card';
import type { Rec, User } from '../shared/types';
import { usePartner } from '../shared/use-partner';

const KEY = 'ft-group';

function readGroup(): number[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

function useGroup(others: User[], fallback: number | null): [number[], (id: number) => void] {
  const valid = (ids: number[]): number[] => ids.filter((id) => others.some((o) => o.id === id));
  const [group, setGroup] = useState<number[]>(() => {
    const saved = valid(readGroup());
    return saved.length ? saved : valid([fallback ?? others[0]?.id ?? 0]);
  });
  const toggle = (id: number): void => {
    const next = group.includes(id) ? group.filter((x) => x !== id) : [...group, id];
    setGroup(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* choix non mémorisé */ }
  };
  return [group, toggle];
}

function useGroupRecs(group: number[]): { items: Rec[] | null; error: string | null } {
  type State = { key: string; items: Rec[] | null; error: string | null };
  const [state, setState] = useState<State>({ key: '', items: null, error: null });
  const key = [...group].sort().join(',');
  useEffect(() => {
    if (!key) return;
    let alive = true;
    get<{ items: Rec[] }>(`/api/taste/group?with=${key}`)
      .then((d) => alive && setState({ key, items: d.items, error: null }))
      .catch((e: unknown) => alive && setState({ key, items: null, error: e instanceof Error ? e.message : 'Erreur' }));
    return () => { alive = false; };
  }, [key]);
  return state.key === key ? state : { items: null, error: null };
}

type PickerProps = { me: User; others: User[]; group: number[]; toggle: (id: number) => void };

function Picker({ me, others, group, toggle }: PickerProps): ReactElement {
  return (
    <div className="row together-picker">
      <span className="chip on"><span className="dot" style={{ background: me.color }} />Moi</span>
      {others.map((o) => (
        <button key={o.id} className={group.includes(o.id) ? 'chip on' : 'chip'} onClick={() => toggle(o.id)}>
          <span className="dot" style={{ background: o.color }} />{o.name}
        </button>
      ))}
    </div>
  );
}

export function TogetherPage(): ReactElement {
  const { me, users } = useSession();
  const others = users.filter((u) => u.id !== me.id);
  const [partner] = usePartner();
  const [group, toggle] = useGroup(others, partner);
  const { items, error } = useGroupRecs(group);
  const names = others.filter((o) => group.includes(o.id)).map((o) => o.name);
  return (
    <div className="page together">
      <div className="eyebrow">Ensemble</div>
      <h1>On regarde quoi, à {group.length + 1} ?</h1>
      <p className="muted">
        Choisis avec qui. Flix mêle vos goûts : ce qui plaît à tous remonte, ce qu’un seul rejette disparaît.
      </p>
      <Picker me={me} others={others} group={group} toggle={toggle} />
      {!group.length && <p className="faint">Ajoute au moins une personne.</p>}
      {group.length > 0 && !items && !error && (
        <p className="faint">Calcul des goûts de {['toi', ...names].join(', ')}…</p>
      )}
      {error && <p className="error">{error}</p>}
      {items && !items.length && <p className="faint">Pas encore assez de titres notés dans ce groupe.</p>}
      <div className="grid">
        <AnimatePresence mode="popLayout">
          {(items ?? []).map((r) => <TitleCard key={r.id} {...r} hint={r.reason} />)}
        </AnimatePresence>
      </div>
    </div>
  );
}
