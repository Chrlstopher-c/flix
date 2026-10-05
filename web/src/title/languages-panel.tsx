/** Ce que TMDB sait des langues du titre — et ce qu'il ne sait pas. */
import type { ReactElement } from 'react';
import { langName } from '../shared/languages';
import type { Details } from './tmdb-types';

export function translationLangs(d: Details): string[] {
  const all = d.translations?.translations ?? [];
  return [...new Set(all.map((t) => t.iso_639_1))];
}

export function LanguagesPanel({ d }: { d: Details }): ReactElement {
  const spoken = d.spoken_languages.map((l) => l.iso_639_1).filter((l) => l !== d.original_language);
  const translated = translationLangs(d)
    .filter((l) => l !== d.original_language)
    .sort((a, b) => langName(a).localeCompare(langName(b), 'fr'));
  return (
    <section className="section languages">
      <div className="eyebrow">Langues</div>
      <div className="lang-grid">
        <div>
          <h3>Langue originale</h3>
          <p className="lang-big serif">{langName(d.original_language)}</p>
        </div>
        <div>
          <h3>Aussi parlées à l'écran</h3>
          <div className="row">
            {spoken.length ? (
              spoken.map((l) => (
                <span key={l} className="chip">
                  {langName(l)}
                </span>
              ))
            ) : (
              <span className="faint">Aucune autre</span>
            )}
          </div>
        </div>
        <div className="lang-wide">
          <h3>
            Fiche traduite en {translated.length} langue{translated.length > 1 ? 's' : ''}
          </h3>
          <div className="row">
            {translated.map((l) => (
              <span key={l} className="chip">
                {langName(l)}
              </span>
            ))}
          </div>
          <p className="faint small">
            TMDB recense les traductions de la fiche (titre, résumé), pas les doublages disponibles. Notez la version
            que vous avez vue dans votre suivi.
          </p>
        </div>
      </div>
    </section>
  );
}
