/** Inviter quelqu'un : la clé d'invitation partagée, et un lien qui la pré-remplit. */
import { useEffect, useState, type ReactElement } from 'react';
import { get, send } from '../shared/api';

function CopyLine({ label, value }: { label: string; value: string }): ReactElement {
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

export function InviteCard(): ReactElement {
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    get<{ key: string }>('/api/invite')
      .then((d) => setKey(d.key))
      .catch(() => setKey(null));
  }, []);
  const rotate = async (): Promise<void> => {
    if (!window.confirm('L’ancienne clé ne permettra plus de créer de compte. Continuer ?')) return;
    setKey((await send<{ key: string }>('POST', '/api/invite')).key);
  };
  return (
    <div className="card stack invite-card">
      <div className="eyebrow">Invitations</div>
      <h3>Inviter quelqu’un</h3>
      <p className="muted">
        Sans cette clé, personne ne peut créer de compte. Envoie le lien : il ouvre la création de compte avec la clé
        déjà remplie.
      </p>
      {key && <CopyLine label="Lien d’invitation" value={`${window.location.origin}/?invite=${key}`} />}
      {key && <CopyLine label="Clé seule" value={key} />}
      <div className="row">
        <button className="btn" onClick={() => void rotate()}>
          Changer la clé
        </button>
      </div>
    </div>
  );
}
