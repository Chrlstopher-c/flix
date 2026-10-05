/** Serveur MCP minimal en HTTP « streamable » sans session : JSON-RPC en entrée, JSON en sortie. */
import type { User } from '../auth/users';
import { log } from '../core/logger';
import { markDirty } from '../taste/scheduler';
import { ToolError, type Tool } from './tool-kit';
import { READ_TOOLS } from './tools-read';
import { WRITE_TOOLS } from './tools-write';

const TOOLS: Tool[] = [...READ_TOOLS, ...WRITE_TOOLS];
const VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const INSTRUCTIONS = `Flix : bibliothèque de films, séries et animés partagée par deux personnes.
Tu agis uniquement sur le compte de la personne qui t'a donné la clé. Utilise search_titles pour obtenir
media_type et tmdb_id avant toute action. Les recommandations se recalculent dans la minute qui suit une modification.`;

type Msg = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
type Reply = Record<string, unknown>;

function ok(id: Msg['id'], result: unknown): Reply {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function err(id: Msg['id'], code: number, message: string): Reply {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

async function callTool(msg: Msg, user: User): Promise<Reply> {
  const name = msg.params?.name;
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return err(msg.id, -32602, `Outil inconnu : ${String(name)}`);
  try {
    const args = (msg.params?.arguments ?? {}) as Record<string, unknown>; // objet JSON-RPC
    const result = await tool.run(args, user);
    if (tool.write) markDirty();
    return ok(msg.id, { content: [{ type: 'text', text: JSON.stringify(result ?? null) }] });
  } catch (e) {
    if (!(e instanceof ToolError)) log.error({ err: e, tool: tool.name }, 'Outil MCP en erreur');
    const message = e instanceof ToolError ? e.message : 'Erreur interne';
    return ok(msg.id, { content: [{ type: 'text', text: message }], isError: true });
  }
}

export async function handle(msg: Msg, user: User): Promise<Reply | null> {
  if (msg.method?.startsWith('notifications/')) return null;
  switch (msg.method) {
    case 'initialize': {
      const asked = String(msg.params?.protocolVersion ?? '');
      return ok(msg.id, {
        protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
        instructions: INSTRUCTIONS,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'flix', version: '1.0.0' },
      });
    }
    case 'ping':
      return ok(msg.id, {});
    case 'tools/list':
      return ok(msg.id, {
        tools: TOOLS.map(({ name, description, inputSchema, write }) => ({
          name,
          description,
          inputSchema,
          annotations: { readOnlyHint: !write },
        })),
      });
    case 'tools/call':
      return callTool(msg, user);
    default:
      return err(msg.id, -32601, `Méthode non prise en charge : ${String(msg.method)}`);
  }
}
