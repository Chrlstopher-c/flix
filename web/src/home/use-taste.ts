/** Recommandations de l'accueil ; se relit toute seule tant qu'un calcul est en cours. */
import { useEffect, useState } from 'react';
import { get } from '../shared/api';
import type { TasteHome } from '../shared/types';

const POLL_MS = 3000;

export function useTaste(): TasteHome | undefined {
  const [data, setData] = useState<TasteHome | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = (): void => {
      get<TasteHome>('/api/taste/home')
        .then((d) => {
          if (!alive) return;
          setData(d);
          if (d.computing) timer = setTimeout(load, POLL_MS);
        })
        .catch(() => { if (alive) timer = setTimeout(load, POLL_MS * 3); });
    };
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);
  return data;
}
