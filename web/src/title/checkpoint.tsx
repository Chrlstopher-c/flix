/** Point d'arrêt : « je me suis arrêté à… », pour un film ou un épisode. */
import { useState, type ReactElement } from 'react';
import { useSession } from '../auth/session';
import { formatTime, parseTime } from '../shared/labels';
import type { TitleActions } from './use-title-state';

export function MovieCheckpoint({ t }: { t: TitleActions }): ReactElement | null {
  const { me } = useSession();
  const cp = t.state?.checkpoints.find((c) => c.userId === me.id);
  if (!t.state?.entries.some((e) => e.userId === me.id)) return null;
  return <CheckpointForm key={cp?.atSeconds ?? 'none'} t={t} atSeconds={cp?.atSeconds ?? null} />;
}

function CheckpointForm({ t, atSeconds }: { t: TitleActions; atSeconds: number | null }): ReactElement {
  const [text, setText] = useState(formatTime(atSeconds));
  const save = (): void => {
    void t.act('PUT', 'checkpoint', { atSeconds: parseTime(text) });
  };
  return (
    <section className="section">
      <div className="card checkpoint">
        <div>
          <div className="eyebrow">Point d'arrêt</div>
          <h3>Je me suis arrêté à</h3>
        </div>
        <input
          className="field time"
          placeholder="1:12:30"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button className="btn" onClick={save}>
          Enregistrer
        </button>
        {atSeconds !== null && (
          <button className="btn ghost small" onClick={() => t.act('PUT', 'checkpoint', { atSeconds: null })}>
            Effacer
          </button>
        )}
      </div>
    </section>
  );
}
