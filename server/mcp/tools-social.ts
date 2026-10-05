/** Outils MCP sociaux : voir les suggestions reçues, suggérer un titre à quelqu'un. */
import { listUsers } from '../auth/users';
import { received, sent, suggest } from '../suggestions/store';
import { schema, text, titleOf, TITLE_PROPS, ToolError, type Tool } from './tool-kit';

function nameOf(id: number): string {
  return listUsers().find((u) => u.id === id)?.name ?? '?';
}

export const SOCIAL_TOOLS: Tool[] = [
  {
    name: 'my_suggestions',
    description: 'Titres que les autres m’ont suggérés (en attente), et ceux que j’ai suggérés.',
    inputSchema: schema({}),
    run: async (_a, user) => ({
      received: received(user.id).map((s) => ({
        from: nameOf(s.fromUser),
        message: s.message,
        media_type: s.card.mediaType,
        tmdb_id: s.card.tmdbId,
        name: s.card.name,
        year: s.card.year,
      })),
      sent: sent(user.id, 15).map((s) => ({ to: nameOf(s.toUser), name: s.card.name, status: s.status })),
    }),
  },
  {
    name: 'suggest_title',
    description: 'Suggère un titre à une ou plusieurs personnes (noms), avec un mot facultatif.',
    write: true,
    inputSchema: schema(
      { ...TITLE_PROPS, to: { type: 'array', items: { type: 'string' } }, message: { type: 'string' } },
      ['media_type', 'tmdb_id', 'to'],
    ),
    run: async (a, user) => {
      const t = titleOf(a);
      const names = (Array.isArray(a.to) ? a.to : []).map((n) => String(n).toLowerCase());
      const targets = listUsers().filter((u) => u.id !== user.id && names.includes(u.name.toLowerCase()));
      if (!targets.length) throw new ToolError('Aucun destinataire reconnu (noms des autres comptes attendus)');
      const count = await suggest(
        user.id,
        targets.map((u) => u.id),
        t.mediaType,
        t.tmdbId,
        text(a, 'message'),
      );
      return { sent_to: targets.map((u) => u.name), count };
    },
  },
];
