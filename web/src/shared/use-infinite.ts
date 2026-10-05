/** Pagination sans fin : charge la page suivante quand le repère de fin devient visible. */
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_PAGES = 60;

type Infinite<T> = { items: T[]; sentinel: (el: HTMLElement | null) => void; done: boolean; loading: boolean };

export function useInfinite<T extends { id: string }>(load: (page: number) => Promise<T[]>): Infinite<T> {
  const [items, setItems] = useState<T[]>([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const page = useRef(0);
  const target = useRef<HTMLElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const busy = useRef(false);
  const seen = useRef(new Set<string>());

  const next = useCallback(async () => {
    if (busy.current || page.current >= MAX_PAGES) return;
    busy.current = true;
    setLoading(true);
    try {
      const batch = await load(++page.current);
      const fresh = batch.filter((x) => !seen.current.has(x.id));
      fresh.forEach((x) => seen.current.add(x.id));
      setItems((cur) => [...cur, ...fresh]);
      if (!batch.length || page.current >= MAX_PAGES) setDone(true);
    } catch {
      page.current--;
    } finally {
      busy.current = false;
      setLoading(false);
      // Si le repère est toujours visible (rangée courte, grand écran), on ré-observe pour enchaîner la page suivante.
      requestAnimationFrame(() => {
        if (target.current && observer.current) {
          observer.current.unobserve(target.current);
          observer.current.observe(target.current);
        }
      });
    }
  }, [load]);

  useEffect(() => () => observer.current?.disconnect(), []);
  const sentinel = useCallback((el: HTMLElement | null) => {
    observer.current?.disconnect();
    target.current = el;
    if (!el) return;
    observer.current = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) void next();
    }, { rootMargin: '0px 400px 800px 0px' });
    observer.current.observe(el);
  }, [next]);

  return { items, sentinel, done, loading };
}
