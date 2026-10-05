/** Rangée défilante horizontale avec titre de section. */
import type { ReactElement, ReactNode } from 'react';

type Props = { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode; width?: number };

export function Rail({ title, eyebrow, action, children, width = 160 }: Props): ReactElement {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      <div className="scroller rail" style={{ ['--rail-w' as string]: `${width}px` }}>
        {children}
      </div>
    </section>
  );
}

export function RailSkeleton({ count = 8 }: { count?: number }): ReactElement {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="title-card">
          <div className="poster skeleton" style={{ aspectRatio: '2 / 3' }} />
        </div>
      ))}
    </>
  );
}
