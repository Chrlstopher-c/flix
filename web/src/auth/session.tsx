/** Session courante : qui je suis, qui est l'autre. */
import { createContext, useContext, type ReactNode } from 'react';
import type { User } from '../shared/types';

type Session = { me: User; users: User[]; refresh: () => void };

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ value, children }: { value: Session; children: ReactNode }): ReactNode {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession hors de SessionProvider');
  return s;
}

export function useUser(id: number): User | undefined {
  return useSession().users.find((u) => u.id === id);
}
