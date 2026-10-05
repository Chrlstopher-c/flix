/** Barre de navigation flottante. */
import { motion } from 'framer-motion';
import { useEffect, type ReactElement } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useSession } from '../auth/session';

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/bibliotheque', label: 'Bibliothèque' },
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

export function Nav(): ReactElement {
  const { me } = useSession();
  useSearchHotkey();
  return (
    <header className="nav">
      <NavLink to="/" className="brand serif">
        Flux<span>Tube</span>
      </NavLink>
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
      <NavLink to="/reglages" className="nav-me" title="Réglages">
        <span className="who" style={{ background: me.color, outlineColor: 'transparent' }}>
          {me.name.slice(0, 1)}
        </span>
      </NavLink>
    </header>
  );
}
