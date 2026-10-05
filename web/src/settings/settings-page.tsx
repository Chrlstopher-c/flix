/** Réglages : nom d'utilisateur, mot de passe, thème, déconnexion. */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useSession } from '../auth/session';
import { send } from '../shared/api';
import { Segmented } from '../shared/segmented';
import { currentTheme, setTheme, type Theme } from '../shared/theme';

type Msg = { ok: boolean; text: string } | null;

function useSubmit(action: () => Promise<void>, success: string): [Msg, (e: FormEvent) => Promise<void>, boolean] {
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    try {
      await action();
      setMsg({ ok: true, text: success });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Échec' });
    } finally {
      setBusy(false);
    }
  };
  return [msg, submit, busy];
}

function NameForm(): ReactElement {
  const { me, refresh } = useSession();
  const [name, setName] = useState(me.name);
  const [msg, submit, busy] = useSubmit(async () => {
    await send('PUT', '/api/me/name', { name: name.trim() });
    refresh();
  }, 'Nom mis à jour');
  return (
    <form className="card stack" onSubmit={submit}>
      <h3>Nom d'utilisateur</h3>
      <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" />
      {msg && <div className={msg.ok ? 'ok-msg' : 'error'}>{msg.text}</div>}
      <div>
        <button className="btn primary" disabled={busy || name.trim() === me.name || name.trim().length < 2}>
          Enregistrer
        </button>
      </div>
    </form>
  );
}

function PasswordForm(): ReactElement {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, submit, busy] = useSubmit(async () => {
    await send('PUT', '/api/me/password', { current, next, confirm });
    setCurrent('');
    setNext('');
    setConfirm('');
  }, 'Mot de passe changé');
  const mismatch = confirm.length > 0 && next !== confirm;
  return (
    <form className="card stack" onSubmit={submit}>
      <h3>Mot de passe</h3>
      <div>
        <label className="label" htmlFor="pw-cur">
          Mot de passe actuel
        </label>
        <input
          id="pw-cur"
          type="password"
          className="field"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="pw-new">
          Nouveau mot de passe
        </label>
        <input
          id="pw-new"
          type="password"
          className="field"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="pw-conf">
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="pw-conf"
          type="password"
          className="field"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {mismatch && <div className="error">Les deux mots de passe ne correspondent pas</div>}
      {msg && <div className={msg.ok ? 'ok-msg' : 'error'}>{msg.text}</div>}
      <div>
        <button className="btn primary" disabled={busy || !current || next.length < 6 || next !== confirm}>
          Changer le mot de passe
        </button>
      </div>
    </form>
  );
}

export function SettingsPage(): ReactElement {
  const [theme, setT] = useState<Theme>(currentTheme);
  const logout = async (): Promise<void> => {
    await send('POST', '/api/logout');
    window.location.assign('/');
  };
  return (
    <div className="page settings">
      <h1>Réglages</h1>
      <div className="settings-grid">
        <NameForm />
        <PasswordForm />
        <div className="card stack">
          <h3>Apparence</h3>
          <Segmented
            options={[
              { value: 'dark', label: 'Sombre' },
              { value: 'light', label: 'Clair' },
            ]}
            value={theme}
            onChange={(v) => {
              setTheme(v);
              setT(v);
            }}
          />
        </div>
        <div className="card stack">
          <h3>Session</h3>
          <div>
            <button className="btn" onClick={logout}>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
