/** Points d'entrée MCP : /mcp (clé en en-tête Bearer) ou /mcp/<clé> ; gestion de la clé depuis les réglages. */
import type { User } from '../auth/users';
import { fail, json } from '../core/http';
import { log } from '../core/logger';
import { handle } from './protocol';
import { createToken, revokeToken, tokenStatus, userFromToken } from './tokens';

function tokenOf(req: Request, path: string): string | null {
  const inPath = path.match(/^\/mcp\/([\w-]+)$/)?.[1];
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  return inPath ?? bearer ?? null;
}

async function rpc(req: Request, user: User): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON invalide' } }, 400);
  }
  const batch = Array.isArray(body);
  const msgs = (batch ? body : [body]) as Parameters<typeof handle>[0][]; // messages JSON-RPC
  const replies = (await Promise.all(msgs.map((m) => handle(m, user)))).filter((r) => r !== null);
  if (!replies.length) return new Response(null, { status: 202 });
  return json(batch ? replies : replies[0]);
}

export async function mcpEndpoint(req: Request, path: string): Promise<Response | null> {
  if (path !== '/mcp' && !path.startsWith('/mcp/')) return null;
  const user = userFromToken(tokenOf(req, path) ?? '');
  if (!user) return json({ error: 'Clé MCP absente ou révoquée' }, 401);
  if (req.method === 'GET')
    return new Response('Flux SSE non pris en charge', { status: 405, headers: { allow: 'POST' } });
  if (req.method === 'DELETE') return new Response(null, { status: 200 });
  if (req.method !== 'POST') return fail(405, 'Méthode non autorisée');
  try {
    return await rpc(req, user);
  } catch (err) {
    log.error({ err }, 'Requête MCP en erreur');
    return json({ jsonrpc: '2.0', id: null, error: { code: -32603, message: 'Erreur interne' } }, 500);
  }
}

/** Réglages : état de la clé, création (montrée une seule fois), révocation. */
export function mcpSettingsRoutes(req: Request, path: string, user: User): Response | null {
  if (path !== '/api/mcp') return null;
  if (req.method === 'GET') return json({ token: tokenStatus(user.id) });
  if (req.method === 'POST') return json({ secret: createToken(user.id), token: tokenStatus(user.id) });
  if (req.method === 'DELETE') {
    revokeToken(user.id);
    return json({ token: null });
  }
  return fail(405, 'Méthode non autorisée');
}
