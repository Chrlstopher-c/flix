/** Point d'entrée : API, images, front compilé. */
import { authRoutes } from './auth/routes';
import { seedUsers, userFromRequest } from './auth/users';
import { ENV } from './core/env';
import { fail } from './core/http';
import { log } from './core/logger';
import { dashboardRoutes } from './dashboard/routes';
import { libraryRoutes } from './library/routes';
import { tasteRoutes } from './taste/routes';
import { markDirty, startScheduler } from './taste/scheduler';
import { pruneCache } from './tmdb/client';
import { serveImage } from './tmdb/images';
import { tmdbRoutes } from './tmdb/routes';

const DIST = `${import.meta.dir}/../dist`;

async function serveStatic(path: string): Promise<Response> {
  const file = Bun.file(`${DIST}${path}`);
  if (path !== '/' && !path.includes('..') && (await file.exists())) {
    const immutable = path.startsWith('/assets/');
    return new Response(file, {
      headers: immutable ? { 'cache-control': 'public, max-age=31536000, immutable' } : {},
    });
  }
  return new Response(Bun.file(`${DIST}/index.html`), { headers: { 'cache-control': 'no-cache' } });
}

async function route(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const img = path.match(/^\/img\/(\w+)\/([\w.-]+)$/);
  if (img?.[1] && img[2]) return serveImage(img[1], img[2]);
  if (!path.startsWith('/api/')) return serveStatic(path);
  const auth = await authRoutes(req, path);
  if (auth) return auth;
  const user = userFromRequest(req);
  if (!user) return fail(401, 'Non connecté');
  const lib = await libraryRoutes(req, path, user);
  if (lib) {
    if (req.method !== 'GET' && lib.ok) markDirty();
    return lib;
  }
  return (
    (await tmdbRoutes(url, path)) ?? (await tasteRoutes(req, path, user)) ?? (await dashboardRoutes(path, user))
    ?? fail(404, 'Route inconnue')
  );
}

seedUsers();
pruneCache();
setInterval(pruneCache, 86_400_000);
startScheduler();

Bun.serve({
  port: ENV.port,
  idleTimeout: 30,
  async fetch(req) {
    try {
      return await route(req);
    } catch (err) {
      log.error({ err, url: req.url }, 'Requête en erreur');
      return fail(500, 'Erreur interne');
    }
  },
});
log.info({ port: ENV.port }, 'FluxTube démarré');
