/** État d'un titre dans notre bibliothèque, et les actions qui le modifient. */
import { useCallback, useEffect, useState } from 'react';
import { ApiError, get, send } from '../shared/api';
import type { MediaType, TitleState } from '../shared/types';

type Method = 'POST' | 'PUT' | 'DELETE';
type Result = TitleState | { removed: true };

export type TitleActions = {
  state: TitleState | null | undefined;
  act: (method: Method, sub: string, body: Record<string, unknown>) => Promise<void>;
  add: (status: string) => Promise<void>;
  error: string | null;
};

function useStoredState(id: string): [TitleState | null | undefined, (v: TitleState | null) => void] {
  const [store, setStore] = useState<{ id: string; value: TitleState | null }>({ id: '', value: null });
  useEffect(() => {
    let alive = true;
    get<TitleState>(`/api/library/${id}`)
      .then((value) => alive && setStore({ id, value }))
      .catch((e: unknown) => alive && e instanceof ApiError && e.status === 404 && setStore({ id, value: null }));
    return () => { alive = false; };
  }, [id]);
  const set = useCallback((value: TitleState | null) => setStore({ id, value }), [id]);
  return [store.id === id ? store.value : undefined, set];
}

export function useTitleState(mediaType: MediaType, tmdbId: number): TitleActions {
  const id = `${mediaType}:${tmdbId}`;
  const [state, setState] = useStoredState(id);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (p: Promise<Result>) => {
    try {
      const next = await p;
      setState('removed' in next ? null : next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action impossible');
    }
  }, [setState]);
  const act = useCallback((method: Method, sub: string, body: Record<string, unknown>) =>
    run(send<Result>(method, `/api/library/${id}/${sub}`, body)), [id, run]);
  const add = useCallback((status: string) =>
    run(send<Result>('POST', '/api/library', { mediaType, tmdbId, status })), [mediaType, tmdbId, run]);
  return { state, act, add, error };
}
