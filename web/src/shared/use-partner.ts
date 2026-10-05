/** La personne choisie pour le duo, mémorisée dans le navigateur et partagée par tout l'accueil. */
import { useEffect, useState } from 'react';

const KEY = 'ft-partner';
const EVENT = 'ft:partner';

function read(): number | null {
  try {
    const v = Number(localStorage.getItem(KEY));
    return Number.isInteger(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function usePartner(): [number | null, (id: number) => void] {
  const [partner, setState] = useState<number | null>(read);
  useEffect(() => {
    const sync = (): void => setState(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const set = (id: number): void => {
    try { localStorage.setItem(KEY, String(id)); } catch { /* choix non mémorisé */ }
    setState(id);
    window.dispatchEvent(new Event(EVENT));
  };
  return [partner, set];
}
