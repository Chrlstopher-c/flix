/** Connexion : nom d'utilisateur et mot de passe. */
import { motion } from 'framer-motion';
import { useState, type FormEvent, type ReactElement } from 'react';
import { send } from '../shared/api';
import { LabeledField } from '../shared/labeled-field';

function useLogin(onDone: () => void) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('POST', '/api/login', { name, password });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setBusy(false);
    }
  };
  return { name, setName, password, setPassword, error, busy, submit };
}

const ENTER = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } };

export function LoginPage({ onDone }: { onDone: () => void }): ReactElement {
  const { name, setName, password, setPassword, error, busy, submit } = useLogin(onDone);
  return (
    <div className="login">
      <div className="login-glow" aria-hidden />
      <motion.form onSubmit={submit} className="login-card" {...ENTER}>
        <div className="brand serif big">Fli<span>x</span></div>
        <p className="muted">Nos films, nos séries, nos animés. Et où on en est.</p>
        <LabeledField id="name" label="Nom d'utilisateur" autoComplete="username" value={name}
          onChange={setName} autoFocus />
        <LabeledField id="password" label="Mot de passe" type="password" autoComplete="current-password"
          value={password} onChange={setPassword} />
        {error && <div className="error">{error}</div>}
        <button className="btn primary" disabled={busy || !name || !password}>{busy ? 'Connexion…' : 'Entrer'}</button>
      </motion.form>
    </div>
  );
}
