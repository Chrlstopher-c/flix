/** Barre de navigation flottante. */
import { motion } from 'framer-motion';
import { useEffect, useState, type ReactElement } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useSession } from '../auth/session';
import { scheduleSnapshot } from '../shared/glass/glass-snapshot';
import { useGlass } from '../shared/glass/use-glass';
import { currentTheme, setTheme, type Theme } from '../shared/theme';

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/bibliotheque', label: 'Bibliothèque' },
  { to: '/ensemble', label: 'Ensemble' },
  { to: '/recherche', label: 'Recherche' },
];

function useSearchHotkey(): void {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const typing = e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        navigate('/recherche');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);
}

function ThemeToggle(): ReactElement {
  const [theme, set] = useState<Theme>(currentTheme);
  const toggle = (): void => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    set(next);
    scheduleSnapshot(450);
  };
  return (
    <button className="nav-theme" onClick={toggle} aria-label={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
      </svg>
    </button>
  );
}

function NavLinks(): ReactElement {
  return (
    <nav className="nav-links">
      {LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} end className="nav-link">
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="nav-label">{l.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function Nav(): ReactElement {
  const { me } = useSession();
  const glass = useGlass<HTMLElement>({ pill: true, tint: 0.3, adaptive: true });
  useSearchHotkey();
  return (
    <header className="nav" ref={glass}>
      <NavLink to="/" className="brand serif">
        Fli<span>x</span>
      </NavLink>
      <NavLinks />
      <ThemeToggle />
      <NavLink to="/reglages" className="nav-me" title="Réglages">
        <span className="who" style={{ background: me.color, outlineColor: 'transparent' }}>
          {me.name.slice(0, 1)}
        </span>
      </NavLink>
    </header>
  );
}
