/** Mon rapport au titre : statut, note, version regardée, étiquettes ; et celui de l'autre. */
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactElement } from 'react';
import { useSession } from '../auth/session';
import { STATUS_LABEL, STATUS_ORDER } from '../shared/labels';
import { shortVersion } from '../shared/languages';
import { Segmented } from '../shared/segmented';
import type { Status } from '../shared/types';
import { Rating } from './rating';
import { TagEditor } from './tag-editor';
import type { TitleActions } from './use-title-state';
import { ViewingLanguages } from './viewing-languages';

const STATUS_OPTIONS = STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s], color: `var(--st-${s})` }));

function Others({ t }: { t: TitleActions }): ReactElement | null {
  const { me, users } = useSession();
  const others = (t.state?.entries ?? []).filter((e) => e.userId !== me.id);
  if (!others.length) return null;
  return (
    <div className="others">
      {others.map((e) => {
        const u = users.find((x) => x.id === e.userId);
        const version = shortVersion(e.languages, t.state?.language ?? null);
        return (
          <div key={e.userId} className="other-line">
            <span className="who" style={{ background: u?.color, outlineColor: `var(--st-${e.status})` }}>
              {u?.name.slice(0, 1)}
            </span>
            <span>
              <b>{u?.name}</b> · {STATUS_LABEL[e.status]}
              {e.rating !== null ? ` · ${e.rating}/10` : ''}
              {version ? ` · ${version}` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MyEntry({
  t,
  original,
  available,
}: {
  t: TitleActions;
  original: string;
  available: string[];
}): ReactElement {
  const { me } = useSession();
  const mine = t.state?.entries.find((e) => e.userId === me.id);
  const setStatus = (s: Status): Promise<void> => (t.state ? t.act('PUT', 'me', { status: s }) : t.add(s));

  return (
    <div className="my-entry">
      <AnimatePresence mode="wait" initial={false}>
        {mine ? (
          <motion.div
            key="in"
            className="stack"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Segmented options={STATUS_OPTIONS} value={mine.status} onChange={setStatus} />
            <div className="row">
              <Rating value={mine.rating} onChange={(rating) => t.act('PUT', 'me', { rating })} />
              <ViewingLanguages
                value={mine.languages}
                original={original}
                available={available}
                onChange={(languages) => t.act('PUT', 'me', { languages })}
              />
            </div>
            <TagEditor t={t} />
            <button className="btn small ghost leave" onClick={() => t.act('DELETE', 'me', {})}>
              Retirer de ma liste
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="out"
            className="row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <button className="btn primary" onClick={() => t.add('a_voir')}>
              + Ma liste
            </button>
            <button className="btn" onClick={() => t.add('en_cours')}>
              Je regarde
            </button>
            <button className="btn" onClick={() => t.add('vu')}>
              Déjà vu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <Others t={t} />
      {t.error && <div className="error">{t.error}</div>}
    </div>
  );
}
