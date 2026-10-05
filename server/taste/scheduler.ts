/** Quand recalculer : peu après une modification, chaque nuit, ou sur demande — jamais deux calculs à la fois. */
import { log } from '../core/logger';
import { computeAll } from './engine';
import { readResult } from './store';

const DEBOUNCE_MS = 90_000;
const TICK_MS = 20_000;
const NIGHT_HOUR = 4;

let dirtyAt = 0;
let running = false;
let lastRunDay = '';

export function markDirty(): void {
  dirtyAt = Date.now();
}

export function isComputing(): boolean {
  return running;
}

export async function runNow(): Promise<void> {
  if (running) return;
  running = true;
  dirtyAt = 0;
  lastRunDay = new Date().toDateString();
  try {
    await computeAll();
  } catch (err) {
    log.error({ err }, 'Calcul des recommandations échoué');
  } finally {
    running = false;
  }
}

function tick(): void {
  const now = new Date();
  const nightly = now.getHours() === NIGHT_HOUR && lastRunDay !== now.toDateString();
  if (nightly || (dirtyAt && Date.now() - dirtyAt > DEBOUNCE_MS)) void runNow();
}

export function startScheduler(): void {
  setInterval(tick, TICK_MS);
  if (!readResult('duo') && !readResult('user:1')) setTimeout(() => void runNow(), 5_000);
}
