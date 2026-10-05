/** Choix exclusif en pastilles, avec indicateur animé. */
import { motion } from 'framer-motion';
import { useId, type ReactElement } from 'react';

type Option<T extends string> = { value: T; label: string; color?: string };

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={o.value === value ? 'seg on' : 'seg'}
        >
          {o.value === value && (
            <motion.span
              layoutId={id}
              className="seg-pill"
              transition={{ type: 'spring', stiffness: 460, damping: 36 }}
            />
          )}
          {o.color && <span className="dot" style={{ background: o.color }} />}
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
