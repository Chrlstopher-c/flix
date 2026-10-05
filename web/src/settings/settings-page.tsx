/** Réglages : nom d'utilisateur, mot de passe, thème, déconnexion. */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useSession } from '../auth/session';
import { send } from '../shared/api';
import { LabeledField } from '../shared/labeled-field';
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
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [msg, submit, busy] = useSubmit(async () => {
    await send('PUT', '/api/me/password', pw);
    setPw({ current: '', next: '', confirm: '' });
  }, 'Mot de passe changé');
  const field = (key: keyof typeof pw) => (v: string) => setPw({ ...pw, [key]: v });
  const valid = pw.current && pw.next.length >= 6 && pw.next === pw.confirm;
  return (
    <form className="card stack" onSubmit={submit}>
      <h3>Mot de passe</h3>
      <LabeledField id="pw-cur" label="Mot de passe actuel" type="password" autoComplete="current-password"
        value={pw.current} onChange={field('current')} />
      <LabeledField id="pw-new" label="Nouveau mot de passe" type="password" autoComplete="new-password"
        value={pw.next} onChange={field('next')} />
      <LabeledField id="pw-conf" label="Confirmer le nouveau mot de passe" type="password" autoComplete="new-password"
        value={pw.confirm} onChange={field('confirm')} />
      {pw.confirm && pw.next !== pw.confirm && <div className="error">Les deux mots de passe ne correspondent pas</div>}
      {msg && <div className={msg.ok ? 'ok-msg' : 'error'}>{msg.text}</div>}
      <div><button className="btn primary" disabled={busy || !valid}>Changer le mot de passe</button></div>
    </form>
  );
}

function ThemeCard(): ReactElement {
  const [theme, setT] = useState<Theme>(currentTheme);
  const options: { value: Theme; label: string }[] = [
    { value: 'dark', label: 'Sombre' },
    { value: 'light', label: 'Clair' },
  ];
  return (
    <div className="card stack">
      <h3>Apparence</h3>
      <Segmented options={options} value={theme} onChange={(v) => { setTheme(v); setT(v); }} />
    </div>
  );
}

async function logout(): Promise<void> {
  await send('POST', '/api/logout');
  window.location.assign('/');
}

export function SettingsPage(): ReactElement {
  return (
    <div className="page settings">
      <h1>Réglages</h1>
      <div className="settings-grid">
        <NameForm />
        <PasswordForm />
        <ThemeCard />
        <div className="card stack">
          <h3>Session</h3>
          <div><button className="btn" onClick={logout}>Se déconnecter</button></div>
        </div>
      </div>
    </div>
  );
}
