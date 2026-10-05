/** Pagination sans fin : charge la page suivante quand le repère de fin devient visible, sans jamais s'emballer. */
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_PAGES = 60;

/** horizontal : la rangée elle-même sert de repère (sinon toute rangée visible charge sans fin). */
type Options = { horizontal?: boolean; maxPages?: number };
const MIN_GAP_MS = 350;
const RETRY_BASE_MS = 1500;
const MAX_FAILURES = 4;
const MAX_STALE_PAGES = 3;

type Infinite<T> = { items: T[]; sentinel: (el: HTMLElement | null) => void; done: boolean; loading: boolean };

export function useInfinite<T extends { id: string }>(
  load: (page: number) => Promise<T[]>,
  opts: Options = {},
): Infinite<T> {
  const maxPages = opts.maxPages ?? MAX_PAGES;
  const [items, setItems] = useState<T[]>([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const page = useRef(0);
  const busy = useRef(false);
  const failures = useRef(0);
  const stale = useRef(0);
  const lastEnd = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const seen = useRef(new Set<string>());
  const target = useRef<HTMLElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const next = useRef<() => void>(() => undefined);

  const rewatch = useCallback((delay: number): void => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = target.current;
      if (!el || !observer.current) return;
      observer.current.unobserve(el);
      observer.current.observe(el);
    }, delay);
  }, []);

  const run = (): void => {
    if (busy.current || page.current >= maxPages) return;
    const wait = lastEnd.current + MIN_GAP_MS - Date.now();
    if (wait > 0) return rewatch(wait);
    busy.current = true;
    setLoading(true);
    const current = page.current + 1;
    load(current)
      .then((batch) => {
        page.current = current;
        failures.current = 0;
        const fresh = batch.filter((x) => !seen.current.has(x.id));
        fresh.forEach((x) => seen.current.add(x.id));
        stale.current = fresh.length ? 0 : stale.current + 1;
        if (fresh.length) setItems((cur) => [...cur, ...fresh]);
        if (!batch.length || page.current >= maxPages || stale.current >= MAX_STALE_PAGES) setDone(true);
        else rewatch(MIN_GAP_MS);
      })
      .catch(() => {
        failures.current++;
        if (failures.current >= MAX_FAILURES) setDone(true);
        else rewatch(RETRY_BASE_MS * 2 ** (failures.current - 1));
      })
      .finally(() => {
        lastEnd.current = Date.now();
        busy.current = false;
        setLoading(false);
      });
  };

  useEffect(() => {
    next.current = run;
  });

  useEffect(
    () => () => {
      observer.current?.disconnect();
      clearTimeout(timer.current);
    },
    [],
  );

  const sentinel = useCallback(
    (el: HTMLElement | null) => {
      observer.current?.disconnect();
      target.current = el;
      if (!el) return;
      const root = opts.horizontal ? el.closest('.scroller') : null;
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) next.current();
        },
        { root, rootMargin: opts.horizontal ? '0px 600px 0px 0px' : '0px 0px 900px 0px' },
      );
      observer.current.observe(el);
    },
    [opts.horizontal],
  );

  return { items, sentinel, done, loading };
}
