/** État d'un titre dans notre bibliothèque, et les actions qui le modifient. */
import { useCallback, useEffect, useState } from 'react';
import { ApiError, get, send } from '../shared/api';
import type { MediaType, TitleState } from '../shared/types';

export type TitleActions = {
  state: TitleState | null | undefined;
  act: (method: 'POST' | 'PUT' | 'DELETE', sub: string, body: Record<string, unknown>) => Promise<void>;
  add: (status: string) => Promise<void>;
  error: string | null;
};

export function useTitleState(mediaType: MediaType, tmdbId: number): TitleActions {
  const id = `${mediaType}:${tmdbId}`;
  const [store, setStore] = useState<{ id: string; value: TitleState | null }>({ id: '', value: null });
  const [error, setError] = useState<string | null>(null);
  const state = store.id === id ? store.value : undefined;
  const setState = useCallback((value: TitleState | null) => setStore({ id, value }), [id]);

  useEffect(() => {
    let alive = true;
    get<TitleState>(`/api/library/${id}`)
      .then((v) => {
        if (alive) setStore({ id, value: v });
      })
      .catch((e: unknown) => {
        if (alive && e instanceof ApiError && e.status === 404) setStore({ id, value: null });
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const run = useCallback(
    async (p: Promise<TitleState | { removed: true }>) => {
      try {
        const next = await p;
        setState('removed' in next ? null : next);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Action impossible');
      }
    },
    [setState],
  );

  const act = useCallback(
    (method: 'POST' | 'PUT' | 'DELETE', sub: string, body: Record<string, unknown>) =>
      run(send(method, `/api/library/${id}/${sub}`, body)),
    [id, run],
  );
  const add = useCallback(
    (status: string) => run(send('POST', '/api/library', { mediaType, tmdbId, status })),
    [mediaType, tmdbId, run],
  );

  return { state, act, add, error };
}
