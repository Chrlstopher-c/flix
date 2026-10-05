/** Ce que TMDB sait des langues du titre — et ce qu'il ne sait pas. */
import type { ReactElement } from 'react';
import { langName } from '../shared/languages';
import type { Details } from './tmdb-types';

export function translationLangs(d: Details): string[] {
  return [...new Set((d.translations?.translations ?? []).map((t) => t.iso_639_1))];
}

function Chips({ langs, empty }: { langs: string[]; empty?: string }): ReactElement {
  if (!langs.length && empty) return <span className="faint">{empty}</span>;
  return <div className="row">{langs.map((l) => <span key={l} className="chip">{langName(l)}</span>)}</div>;
}

export function LanguagesPanel({ d }: { d: Details }): ReactElement {
  const spoken = d.spoken_languages.map((l) => l.iso_639_1).filter((l) => l !== d.original_language);
  const translated = translationLangs(d).filter((l) => l !== d.original_language)
    .sort((a, b) => langName(a).localeCompare(langName(b), 'fr'));
  const plural = translated.length > 1 ? 's' : '';
  return (
    <section className="section languages">
      <div className="eyebrow">Langues</div>
      <div className="lang-grid">
        <div><h3>Langue originale</h3><p className="lang-big serif">{langName(d.original_language)}</p></div>
        <div><h3>Aussi parlées à l'écran</h3><Chips langs={spoken} empty="Aucune autre" /></div>
        <div className="lang-wide">
          <h3>Fiche traduite en {translated.length} langue{plural}</h3>
          <Chips langs={translated} />
          <p className="faint small">
            TMDB recense les traductions de la fiche (titre, résumé), pas les doublages disponibles.
            Notez la version que vous avez vue dans votre suivi.
          </p>
        </div>
      </div>
    </section>
  );
}
