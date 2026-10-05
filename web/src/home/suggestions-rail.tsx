/** « Suggéré pour toi » : ce que les autres pensent qui pourrait te plaire. */
import type { ReactElement } from 'react';
import { useSession } from '../auth/session';
import { Rail } from '../shared/rail';
import { TitleCard } from '../shared/title-card';
import type { Suggestion } from '../shared/types';
import { useApi } from '../shared/use-api';

export function SuggestionsRail(): ReactElement | null {
  const { users } = useSession();
  const { data } = useApi<{ received: Suggestion[] }>('/api/suggestions');
  const items = data?.received ?? [];
  if (!items.length) return null;
  const hint = (s: Suggestion): string => {
    const from = users.find((u) => u.id === s.fromUser)?.name ?? '?';
    return s.message ? `${from} · « ${s.message} »` : `De la part de ${from}`;
  };
  return (
    <Rail title="Suggéré pour toi" eyebrow={`${items.length} suggestion${items.length > 1 ? 's' : ''}`} width={170}>
      {items.map((s) => <TitleCard key={s.id} {...s.card} hint={hint(s)} />)}
    </Rail>
  );
}
