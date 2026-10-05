/** Connexion : nom d'utilisateur et mot de passe. */
import { motion } from 'framer-motion';
import { useState, type FormEvent, type ReactElement } from 'react';
import { send } from '../shared/api';

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

export function LoginPage({ onDone }: { onDone: () => void }): ReactElement {
  const { name, setName, password, setPassword, error, busy, submit } = useLogin(onDone);
  return (
    <div className="login">
      <div className="login-glow" aria-hidden />
      <motion.form
        onSubmit={submit}
        className="login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="brand serif big">
          Flux<span>Tube</span>
        </div>
        <p className="muted">Nos films, nos séries, nos animés. Et où on en est.</p>
        <div>
          <label className="label" htmlFor="name">
            Nom d'utilisateur
          </label>
          <input
            id="name"
            className="field"
            autoComplete="username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            className="field"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn primary" disabled={busy || !name || !password}>
          {busy ? 'Connexion…' : 'Entrer'}
        </button>
      </motion.form>
    </div>
  );
}
