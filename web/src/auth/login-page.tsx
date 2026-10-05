/** Entrée de l'app : connexion, ou création de compte avec une clé d'invitation. */
import { AnimatePresence, motion } from 'framer-motion';
import { useState, type FormEvent, type ReactElement } from 'react';
import { send } from '../shared/api';
import { LabeledField } from '../shared/labeled-field';

type Mode = 'login' | 'signup';
type Form = { name: string; password: string; confirm: string; key: string };

function inviteFromUrl(): string {
  return new URLSearchParams(window.location.search).get('invite') ?? '';
}

function useEntry(onDone: () => void) {
  const invite = inviteFromUrl();
  const [mode, setMode] = useState<Mode>(invite ? 'signup' : 'login');
  const [f, setF] = useState<Form>({ name: '', password: '', confirm: '', key: invite });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Form) => (v: string) => setF((cur) => ({ ...cur, [k]: v }));
  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('POST', mode === 'login' ? '/api/login' : '/api/signup', f);
      if (invite) window.history.replaceState({}, '', '/');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible pour le moment');
    } finally {
      setBusy(false);
    }
  };
  const ready = f.name && f.password && (mode === 'login' || (f.confirm && f.key));
  return { mode, setMode, f, set, error, busy, submit, ready };
}

const ENTER = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};
const FIELD = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

function SignupFields({ f, set }: { f: Form; set: (k: keyof Form) => (v: string) => void }): ReactElement {
  return (
    <motion.div className="stack signup-fields" {...FIELD}>
      <LabeledField
        id="confirm"
        label="Confirmer le mot de passe"
        type="password"
        autoComplete="new-password"
        value={f.confirm}
        onChange={set('confirm')}
      />
      <LabeledField id="key" label="Clé d’invitation" autoComplete="off" value={f.key} onChange={set('key')} />
    </motion.div>
  );
}

type Setter = (k: keyof Form) => (v: string) => void;

function BaseFields({ f, set, signup }: { f: Form; set: Setter; signup: boolean }): ReactElement {
  return (
    <>
      <LabeledField id="name" label="Nom d'utilisateur" autoComplete="username" value={f.name} onChange={set('name')}
        autoFocus />
      <LabeledField id="password" label="Mot de passe" type="password" value={f.password} onChange={set('password')}
        autoComplete={signup ? 'new-password' : 'current-password'} />
    </>
  );
}

const TAGLINE = {
  login: 'Nos films, nos séries, nos animés. Et où on en est.',
  signup: 'Rejoins le cercle avec ta clé d’invitation.',
};

export function LoginPage({ onDone }: { onDone: () => void }): ReactElement {
  const { mode, setMode, f, set, error, busy, submit, ready } = useEntry(onDone);
  const signup = mode === 'signup';
  return (
    <div className="login">
      <div className="login-glow" aria-hidden />
      <motion.form onSubmit={submit} className="login-card" {...ENTER}>
        <div className="brand serif big">Fli<span>x</span></div>
        <p className="muted">{TAGLINE[mode]}</p>
        <BaseFields f={f} set={set} signup={signup} />
        <AnimatePresence initial={false}>{signup && <SignupFields key="s" f={f} set={set} />}</AnimatePresence>
        {error && <div className="error">{error}</div>}
        <button className="btn primary" disabled={busy || !ready}>
          {busy ? '…' : signup ? 'Créer mon compte' : 'Entrer'}
        </button>
        <button type="button" className="btn ghost switch-mode" onClick={() => setMode(signup ? 'login' : 'signup')}>
          {signup ? 'J’ai déjà un compte' : 'Créer un compte'}
        </button>
      </motion.form>
    </div>
  );
}
