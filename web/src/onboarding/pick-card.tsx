/** Vignette de démarrage : l'affiche et quatre réponses en un geste. */
import { motion } from 'framer-motion';
import type { ReactElement } from 'react';
import { KIND_LABEL } from '../shared/labels';
import { Poster } from '../shared/poster';
import type { Card } from '../shared/types';
import { CHOICES, type Choice } from './choices';

type Props = { card: Card; choice: Choice | undefined; onPick: (c: Choice | null) => void };

export function PickCard({ card, choice, onPick }: Props): ReactElement {
  const picked = CHOICES.find((c) => c.value === choice);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`pick${choice ? ' done' : ''}`}
    >
      <div className="pick-art">
        <Poster path={card.poster} alt={card.name} />
        {picked && <span className={`pick-badge ${picked.value}`}>{picked.label}</span>}
      </div>
      <div className="title-card-name">{card.name}</div>
      <div className="title-card-meta">{[KIND_LABEL[card.kind], card.year].filter(Boolean).join(' · ')}</div>
      <div className="pick-actions">
        {CHOICES.map((c) => (
          <button
            key={c.value}
            className={`pick-btn ${c.value}${choice === c.value ? ' on' : ''}`}
            title={c.label}
            aria-label={c.label}
            onClick={() => onPick(choice === c.value ? null : c.value)}
          >
            {c.icon}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
