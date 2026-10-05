/** Proxy d'images TMDB avec copie sur disque : une affiche n'est téléchargée qu'une fois. */
import { mkdirSync } from 'node:fs';
import { ENV } from '../core/env';
import { log } from '../core/logger';

const SIZES = new Set(['w92', 'w185', 'w342', 'w500', 'w780', 'w1280', 'h632', 'original']);
const DIR = `${ENV.dataDir}/images`;
mkdirSync(DIR, { recursive: true });

const CACHE_HEADERS = { 'cache-control': 'public, max-age=31536000, immutable', 'content-type': 'image/jpeg' };

export async function serveImage(size: string, file: string): Promise<Response> {
  if (!SIZES.has(size) || !/^[\w-]+\.(jpg|png|svg)$/.test(file)) return new Response('Not found', { status: 404 });
  const local = Bun.file(`${DIR}/${size}_${file}`);
  if (await local.exists()) return new Response(local, { headers: CACHE_HEADERS });
  try {
    const res = await fetch(`https://image.tmdb.org/t/p/${size}/${file}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return new Response('Not found', { status: 404 });
    const bytes = await res.arrayBuffer();
    await Bun.write(local, bytes);
    return new Response(bytes, { headers: CACHE_HEADERS });
  } catch (err) {
    log.error({ err, size, file }, 'Image TMDB indisponible');
    return new Response('Bad gateway', { status: 502 });
  }
}
