/** Lecture d'une route avec cache, rechargement après mutation et état de chargement. */
import { useEffect, useState } from 'react';
import { cached, get, onInvalidate } from './api';

export type ApiState<T> = { data: T | undefined; error: string | null; loading: boolean };

type Store<T> = { path: string | null; data?: T; error: string | null };

export function useApi<T>(path: string | null): ApiState<T> {
  const [store, setStore] = useState<Store<T>>({ path, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => onInvalidate(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    get<T>(path)
      .then((data) => {
        if (alive) setStore({ path, data, error: null });
      })
      .catch((e: unknown) => {
        if (alive) setStore({ path, error: e instanceof Error ? e.message : 'Erreur' });
      });
    return () => {
      alive = false;
    };
  }, [path, tick]);

  const fresh = store.path === path;
  const data = (fresh ? store.data : undefined) ?? (path ? cached<T>(path) : undefined);
  const error = fresh ? store.error : null;
  return { data, error, loading: !data && !error };
}
