/** Suggérer le titre à d'autres (pastilles à cocher, mot facultatif), et voir ce qu'on m'en a dit. */
import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactElement } from 'react';
import { useSession } from '../auth/session';
import { send } from '../shared/api';
import type { MediaType, Suggestion, User } from '../shared/types';
import { useApi } from '../shared/use-api';

type ForTitle = { toMe: Suggestion[]; fromMe: Suggestion[] };
type Props = { mediaType: MediaType; tmdbId: number; inMyList: boolean; onAccepted: () => void };
type Act = (s: Suggestion, what: 'accept' | 'dismiss') => void;

function ReceivedLine({ s, from, act }: { s: Suggestion; from: User | undefined; act: Act }): ReactElement {
  return (
    <div className="suggest-received">
      <span className="who" style={{ background: from?.color, outlineColor: 'transparent' }}>
        {from?.name.slice(0, 1)}
      </span>
      <span><b>{from?.name}</b> te le suggère{s.message ? ` : « ${s.message} »` : ''}</span>
      <span className="row">
        <button className="btn small primary" onClick={() => act(s, 'accept')}>Ajouter à ma liste</button>
        <button className="btn small ghost" onClick={() => act(s, 'dismiss')}>Ignorer</button>
      </span>
    </div>
  );
}

function Recipients({ to, toggle, sentTo }: { to: number[]; toggle: (id: number) => void; sentTo: number[] }):
  ReactElement {
  const { me, users } = useSession();
  return (
    <div className="row">
      {users.filter((u) => u.id !== me.id).map((u) => (
        <button key={u.id} className={to.includes(u.id) ? 'chip on' : 'chip'} onClick={() => toggle(u.id)}>
          <span className="dot" style={{ background: u.color }} />
          {u.name}
          {sentTo.includes(u.id) ? ' · déjà suggéré' : ''}
        </button>
      ))}
    </div>
  );
}

const APPEAR = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } };

function Composer({ props, sentTo, onSent }: { props: Props; sentTo: number[]; onSent: () => void }): ReactElement {
  const [to, setTo] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const toggle = (id: number): void => setTo((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const submit = async (): Promise<void> => {
    await send('POST', '/api/suggestions', { mediaType: props.mediaType, tmdbId: props.tmdbId, to, message });
    onSent();
  };
  return (
    <motion.div className="stack suggest-compose" {...APPEAR}>
      <Recipients to={to} toggle={toggle} sentTo={sentTo} />
      <input className="field" placeholder="Un mot pour accompagner (facultatif)" value={message} maxLength={280}
        onChange={(e) => setMessage(e.target.value)} />
      <div className="row">
        <button className="btn primary small" disabled={!to.length} onClick={() => void submit()}>Envoyer</button>
      </div>
    </motion.div>
  );
}

function SentNote({ done, sentTo }: { done: boolean; sentTo: number[] }): ReactElement | null {
  const { users } = useSession();
  if (done) return <span className="ok-msg">Suggestion envoyée</span>;
  if (!sentTo.length) return null;
  const names = users.filter((u) => sentTo.includes(u.id)).map((u) => u.name).join(', ');
  return <span className="faint small">Suggéré à {names}</span>;
}

export function SuggestPanel(props: Props): ReactElement | null {
  const { users } = useSession();
  const { data } = useApi<ForTitle>(`/api/suggestions/title/${props.mediaType}:${props.tmdbId}`);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  if (users.length < 2) return null;
  const act: Act = (s, what) => {
    if (what === 'accept') props.onAccepted();
    else void send('POST', `/api/suggestions/${s.id}/dismiss`);
  };
  const sentTo = (data?.fromMe ?? []).map((s) => s.toUser);
  const toMe = props.inMyList ? [] : (data?.toMe ?? []);
  return (
    <div className="suggest">
      {toMe.map((s) => <ReceivedLine key={s.id} s={s} from={users.find((u) => u.id === s.fromUser)} act={act} />)}
      <div className="row">
        <button className="btn small" onClick={() => { setOpen(!open); setDone(false); }}>Suggérer à…</button>
        <SentNote done={done} sentTo={sentTo} />
      </div>
      <AnimatePresence>
        {open && <Composer props={props} sentTo={sentTo} onSent={() => { setOpen(false); setDone(true); }} />}
      </AnimatePresence>
    </div>
  );
}
