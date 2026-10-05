/** Avis et moments marquants des deux, avec filtres. */
import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactElement } from 'react';
import { useSession } from '../auth/session';
import { formatTime } from '../shared/labels';
import { langName } from '../shared/languages';
import { Segmented } from '../shared/segmented';
import type { Note } from '../shared/types';
import { NoteComposer } from './note-composer';
import type { Draft } from './seasons-panel';
import type { TitleActions } from './use-title-state';

type Props = { t: TitleActions; isTv: boolean; original: string; draft: Draft; clearDraft: () => void };

function where(n: Note, original: string): string {
  return [
    n.season !== null && `S${n.season}`,
    n.episode !== null && `É${n.episode}`,
    n.atSeconds !== null && formatTime(n.atSeconds),
    n.language && (n.language === original ? 'VO' : langName(n.language)),
  ]
    .filter(Boolean)
    .join(' · ');
}

function NoteItem({ n, t, original }: { n: Note; t: TitleActions; original: string }): ReactElement {
  const { me, users } = useSession();
  const u = users.find((x) => x.id === n.userId);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`note ${n.kind}`}
    >
      <div className="note-head">
        <span className="who" style={{ background: u?.color, outlineColor: 'transparent' }}>
          {u?.name.slice(0, 1)}
        </span>
        <b>{u?.name}</b>
        <span className="note-kind">{n.kind === 'moment' ? 'Moment' : 'Avis'}</span>
        <span className="faint">{where(n, original)}</span>
        <span className="faint note-date">
          {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
        {n.userId === me.id && (
          <button
            className="chip-x"
            aria-label="Supprimer"
            onClick={() => t.act('DELETE', 'notes', { noteId: n.id })}
          >
            ×
          </button>
        )}
      </div>
      <p>{n.body}</p>
    </motion.article>
  );
}

type NoteFilter = 'all' | 'avis' | 'moment';
const FILTERS: { value: NoteFilter; label: string }[] = [
  { value: 'all', label: 'Tout' }, { value: 'avis', label: 'Avis' }, { value: 'moment', label: 'Moments' },
];

export function NotesPanel({ t, isTv, original, draft, clearDraft }: Props): ReactElement | null {
  const [filter, setFilter] = useState<NoteFilter>('all');
  if (!t.state) return null;
  const notes = t.state.notes.filter((n) => filter === 'all' || n.kind === filter);
  const key = draft ? `${draft.season}-${draft.episode}-${draft.nonce}` : 'free';
  return (
    <section className="section notes">
      <div className="section-head">
        <h2>Nos notes</h2>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <NoteComposer key={key} t={t} isTv={isTv} original={original} draft={draft} onDone={clearDraft} />
      <div className="note-list">
        <AnimatePresence mode="popLayout">
          {notes.map((n) => <NoteItem key={n.id} n={n} t={t} original={original} />)}
        </AnimatePresence>
        {!notes.length && <p className="faint">Rien encore. Le premier avis donne le ton.</p>}
      </div>
    </section>
  );
}
