/** Routes goûts : accueil personnalisé, sélection de démarrage, recalcul à la demande. */
import type { User } from '../auth/users';
import { json } from '../core/http';
import { log } from '../core/logger';
import { listLibrary } from '../library/queries';
import type { TasteResult } from './engine';
import { onboardingCards } from './onboarding';
import { isComputing, runNow } from './scheduler';
import { readResult } from './store';

const ONBOARDING_MIN = 5;

function home(user: User): Response {
  const mine = readResult<TasteResult>(`user:${user.id}`);
  const duo = readResult<TasteResult>('duo');
  const rated = mine?.body.rated ?? 0;
  return json({
    forYou: mine?.body.forYou ?? [],
    because: mine?.body.because ?? [],
    duo: duo?.body.forYou ?? [],
    rated,
    needsOnboarding: rated < ONBOARDING_MIN,
    computing: isComputing(),
    computedAt: mine?.computedAt ?? null,
  });
}

export async function tasteRoutes(req: Request, path: string, user: User): Promise<Response | null> {
  if (!path.startsWith('/api/taste/')) return null;
  try {
    if (path === '/api/taste/home') return home(user);
    if (path === '/api/taste/refresh' && req.method === 'POST') {
      void runNow();
      return json({ computing: true }, 202);
    }
    if (path === '/api/taste/onboarding') {
      const isMine = (t: Record<string, unknown>): boolean =>
        (t.entries as { userId: number }[]).some((e) => e.userId === user.id); // forme listLibrary
      const mine = listLibrary().filter(isMine);
      return json({ results: await onboardingCards(new Set(mine.map((t) => String(t.id)))) });
    }
  } catch (err) {
    log.error({ err, path }, 'Route goûts en erreur');
    return json({ error: 'Recommandations indisponibles' }, 503);
  }
  return null;
}
