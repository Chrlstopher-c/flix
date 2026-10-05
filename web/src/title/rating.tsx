/** Note sur 10, cliquable, effaçable. */
import { useState, type ReactElement } from 'react';

export function Rating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}): ReactElement {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  return (
    <div className="rating" onMouseLeave={() => setHover(null)} aria-label="Ma note">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          className={n <= shown ? 'tick on' : 'tick'}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n === value ? null : n)}
          aria-label={`${n} sur 10`}
        />
      ))}
      <span className="rating-value">{value !== null || hover ? `${shown}/10` : 'Noter'}</span>
    </div>
  );
}
