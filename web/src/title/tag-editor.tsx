/** Étiquettes libres du titre, partagées entre nous. */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useLibrary } from '../shared/use-library';
import type { Tag } from '../shared/types';
import type { TitleActions } from './use-title-state';

function TagChip({ g, onRemove }: { g: Tag; onRemove: () => void }): ReactElement {
  return (
    <span className="chip">
      <span className="dot" style={{ background: g.color }} />{g.name}
      <button type="button" className="chip-x" aria-label={`Retirer ${g.name}`} onClick={onRemove}>×</button>
    </span>
  );
}

export function TagEditor({ t }: { t: TitleActions }): ReactElement {
  const [name, setName] = useState('');
  const { data } = useLibrary();
  const submit = (e: FormEvent): void => {
    e.preventDefault();
    if (!name.trim()) return;
    void t.act('POST', 'tags', { name: name.trim() });
    setName('');
  };
  return (
    <form className="row tags" onSubmit={submit}>
      {(t.state?.tags ?? []).map((g) => (
        <TagChip key={g.id} g={g} onRemove={() => void t.act('DELETE', 'tags', { tagId: g.id })} />
      ))}
      <input className="tag-input" list="all-tags" placeholder="+ étiquette" value={name}
        onChange={(e) => setName(e.target.value)} />
      <datalist id="all-tags">{data?.tags.map((g) => <option key={g.id} value={g.name} />)}</datalist>
    </form>
  );
}
