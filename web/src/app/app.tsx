/** Racine : charge la session, affiche la connexion ou l'application. */
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { LoginPage } from '../auth/login-page';
import { SessionProvider } from '../auth/session';
import { HomePage } from '../home/home-page';
import { LibraryPage } from '../library/library-page';
import { OnboardingPage } from '../onboarding/onboarding-page';
import { PersonPage } from '../person/person-page';
import { SearchPage } from '../search/search-page';
import { SettingsPage } from '../settings/settings-page';
import { get } from '../shared/api';
import type { User } from '../shared/types';
import { TitlePage } from '../title/title-page';
import { Nav } from './nav';

type Me = { me: User; users: User[] };

function useMe(): { me: Me | null | undefined; refresh: () => void } {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const refresh = useCallback(() => {
    get<Me>('/api/me')
      .then(setMe)
      .catch(() => setMe(null));
  }, []);
  useEffect(() => {
    refresh();
    const out = (): void => setMe(null);
    window.addEventListener('ft:logout', out);
    return () => window.removeEventListener('ft:logout', out);
  }, [refresh]);
  return { me, refresh };
}

function AnimatedRoutes(): ReactElement {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  return (
    <motion.main
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/bibliotheque" element={<LibraryPage />} />
        <Route path="/recherche" element={<SearchPage />} />
        <Route path="/titre/:type/:id" element={<TitlePage />} />
        <Route path="/personne/:id" element={<PersonPage />} />
        <Route path="/reglages" element={<SettingsPage />} />
        <Route path="/decouverte" element={<OnboardingPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </motion.main>
  );
}

export function App(): ReactElement | null {
  const { me, refresh } = useMe();
  if (me === undefined) return null;
  if (me === null) return <LoginPage onDone={refresh} />;
  return (
    <SessionProvider value={{ ...me, refresh }}>
      <Nav />
      <AnimatedRoutes />
    </SessionProvider>
  );
}
