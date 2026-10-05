/** Carte « Flix pour Claude » : clé MCP personnelle, instructions de branchement, capacités. */
import { useEffect, useState, type ReactElement } from 'react';
import { get, send } from '../shared/api';

type Status = { createdAt: number; lastUsedAt: number | null } | null;

const CAN = [
  'Chercher des titres et lire leurs fiches',
  'Lire et modifier ta bibliothèque : statut, note, version, épisodes, point d’arrêt, avis et moments',
  'Lire tes recommandations et celles du duo',
];
const CANNOT = 'Elle n’agit jamais sur le compte de l’autre et ne voit pas son suivi.';

function day(ts: number | null): string {
  return ts ? new Date(ts).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'jamais';
}

function Copy({ label, value }: { label: string; value: string }): ReactElement {
  const [done, setDone] = useState(false);
  const copy = (): void => {
    void navigator.clipboard?.writeText(value).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    });
  };
  return (
    <div className="mcp-copy">
      <div className="label">{label}</div>
      <div className="mcp-code">
        <code>{value}</code>
        <button className="btn small" onClick={copy}>
          {done ? 'Copié' : 'Copier'}
        </button>
      </div>
    </div>
  );
}

function Setup({ secret }: { secret: string }): ReactElement {
  const origin = window.location.origin;
  return (
    <div className="stack mcp-setup">
      <p className="ok-msg">Clé créée. Elle ne sera plus affichée : copie-la maintenant.</p>
      <Copy
        label="Claude Code (terminal)"
        value={`claude mcp add --transport http flix ${origin}/mcp --header "Authorization: Bearer ${secret}"`}
      />
      <Copy
        label="Claude (web, bureau, mobile) → Paramètres → Connecteurs → Ajouter un connecteur personnalisé"
        value={`${origin}/mcp/${secret}`}
      />
    </div>
  );
}

function useMcp(): {
  status: Status;
  secret: string | null;
  create: () => Promise<void>;
  revoke: () => Promise<void>;
} {
  const [status, setStatus] = useState<Status>(null);
  const [secret, setSecret] = useState<string | null>(null);
  useEffect(() => {
    get<{ token: Status }>('/api/mcp')
      .then((d) => setStatus(d.token))
      .catch(() => setStatus(null));
  }, []);
  const create = async (): Promise<void> => {
    const d = await send<{ secret: string; token: Status }>('POST', '/api/mcp');
    setSecret(d.secret);
    setStatus(d.token);
  };
  const revoke = async (): Promise<void> => {
    await send('DELETE', '/api/mcp');
    setSecret(null);
    setStatus(null);
  };
  return { status, secret, create, revoke };
}

function Actions({ has, create, revoke }: { has: boolean; create: () => Promise<void>; revoke: () => Promise<void> }):
  ReactElement {
  const regen = (): void => {
    if (window.confirm('L’ancienne clé cessera de fonctionner. Continuer ?')) void create();
  };
  if (!has) {
    return (
      <div className="row">
        <button className="btn primary" onClick={() => void create()}>Générer ma clé</button>
      </div>
    );
  }
  return (
    <div className="row">
      <button className="btn" onClick={regen}>Régénérer</button>
      <button className="btn ghost" onClick={() => void revoke()}>Révoquer</button>
    </div>
  );
}

export function McpCard(): ReactElement {
  const { status, secret, create, revoke } = useMcp();
  return (
    <div className="card stack mcp-card">
      <div className="eyebrow">MCP</div>
      <h3>Flix pour Claude</h3>
      <p className="muted">Une clé personnelle permet à Claude d’utiliser Flix en ton nom.</p>
      <ul className="mcp-list">{CAN.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="faint small">{CANNOT}</p>
      {status && (
        <p className="faint small">
          Clé créée le {day(status.createdAt)} · dernière utilisation : {day(status.lastUsedAt)}
        </p>
      )}
      {secret && <Setup secret={secret} />}
      <Actions has={Boolean(status)} create={create} revoke={revoke} />
    </div>
  );
}
