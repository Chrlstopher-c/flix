/** Mon rapport au titre : statut, note, version regardée, étiquettes ; et celui de l'autre. */
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactElement } from 'react';
import { useSession } from '../auth/session';
import { STATUS_LABEL, STATUS_ORDER } from '../shared/labels';
import { shortVersion } from '../shared/languages';
import { Segmented } from '../shared/segmented';
import type { Entry } from '../shared/types';
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

const FADE = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } };
type Props = { t: TitleActions; original: string; available: string[] };

function Tracked({ t, original, available, entry }: Props & { entry: Entry }): ReactElement {
  return (
    <motion.div key="in" className="stack" {...FADE}>
      <Segmented options={STATUS_OPTIONS} value={entry.status} onChange={(status) => t.act('PUT', 'me', { status })} />
      <div className="row">
        <Rating value={entry.rating} onChange={(rating) => t.act('PUT', 'me', { rating })} />
        <ViewingLanguages value={entry.languages} original={original} available={available}
          onChange={(languages) => t.act('PUT', 'me', { languages })} />
      </div>
      <TagEditor t={t} />
      <button className="btn small ghost leave" onClick={() => t.act('DELETE', 'me', {})}>Retirer de ma liste</button>
    </motion.div>
  );
}

export function MyEntry(props: Props): ReactElement {
  const { t } = props;
  const { me } = useSession();
  const mine = t.state?.entries.find((e) => e.userId === me.id);
  return (
    <div className="my-entry">
      <AnimatePresence mode="wait" initial={false}>
        {mine ? <Tracked key="in" {...props} entry={mine} /> : (
          <motion.div key="out" className="row" {...FADE}>
            <button className="btn primary" onClick={() => t.add('a_voir')}>+ Ma liste</button>
            <button className="btn" onClick={() => t.add('en_cours')}>Je regarde</button>
            <button className="btn" onClick={() => t.add('vu')}>Déjà vu</button>
          </motion.div>
        )}
      </AnimatePresence>
      <Others t={t} />
      {t.error && <div className="error">{t.error}</div>}
    </div>
  );
}
