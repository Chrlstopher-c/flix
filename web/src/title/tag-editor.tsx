/** Étiquettes libres du titre, partagées entre nous. */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useLibrary } from '../shared/use-library';
import type { TitleActions } from './use-title-state';

export function TagEditor({ t }: { t: TitleActions }): ReactElement {
  const [name, setName] = useState('');
  const { data } = useLibrary();
  const tags = t.state?.tags ?? [];
  const submit = (e: FormEvent): void => {
    e.preventDefault();
    if (!name.trim()) return;
    void t.act('POST', 'tags', { name: name.trim() });
    setName('');
  };
  return (
    <form className="row tags" onSubmit={submit}>
      {tags.map((g) => (
        <span key={g.id} className="chip">
          <span className="dot" style={{ background: g.color }} />
          {g.name}
          <button
            type="button"
            className="chip-x"
            aria-label={`Retirer ${g.name}`}
            onClick={() => t.act('DELETE', 'tags', { tagId: g.id })}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="tag-input"
        list="all-tags"
        placeholder="+ étiquette"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <datalist id="all-tags">
        {data?.tags.map((g) => (
          <option key={g.id} value={g.name} />
        ))}
      </datalist>
    </form>
  );
}
