# Architecture

Monolithe modulaire : un serveur Bun sert l'API, les images et le front compilé. Organisation par domaine.

## Domaines

| Dossier | Rôle |
|---|---|
| `common/` | Règles métier partagées serveur + front (classification film / série / animé). Seule source de vérité. |
| `server/core/` | Transverse : env, base SQLite + schéma, logs, helpers HTTP. Aucune logique métier. |
| `server/auth/` | Comptes, sessions par cookie, réglages (nom, mot de passe). |
| `server/tmdb/` | Accès TMDB avec cache SQLite, proxy d'images avec copie disque, routes catalogue. |
| `server/library/` | Ce que nous faisons des titres : fiches locales, statut par personne, étiquettes, avis et moments. |
| `server/progress/` | Où chacun en est : points d'arrêt et épisodes cochés. |
| `server/dashboard/` | Tableau de bord de l'accueil (grille bento) : agrège bibliothèque, progression, notes et goûts. Lecture seule. |
| `server/taste/` | Goûts et recommandations : traits des titres, profils par personne et duo, candidats, classement, calcul de fond. |
| `web/src/app/` | Montage, routage, navigation. |
| `web/src/shared/` | Design system (CSS, composants génériques), client API, utilitaires de langue et libellés. |
| `web/src/<page>/` | Une tranche verticale par écran : `home`, `library`, `search`, `title`, `person`, `settings`, `auth`, `onboarding`. |

## Règles de frontière

- Un domaine serveur n'importe que `core/` et l'API publique (fonctions exportées) d'un autre domaine.
- `library/routes.ts` est le seul point d'entrée HTTP de `library/` et `progress/`.
- Le front ne parle au serveur que via `shared/api.ts`.
- Toute requête TMDB passe par `tmdb/client.ts` (cache obligatoire), toute image par `/img/…` (copie locale).

## Recommandations (`server/taste/`)

1. **Traits** d'un titre (fiche TMDB complète, cache partagé avec la page titre) : genres, 12 mots-clés, 5 acteurs,
   réalisation / création, langue originale, décennie, type.
2. **Poids d'un suivi** : la note prime (`(note − 5) / 2,5`), sinon le statut (vu 1, en cours 0,8, à voir 0,35),
   abandon −1,5, +0,1 par note écrite.
3. **Profil** = somme pondérée des traits (normalisée par la taille du titre, échelle par type de trait).
4. **Duo** : moyenne des deux profils moins la moitié de l'écart, le rejet de l'un l'emporte, bonus des titres vus
   ensemble (deux ajouts à moins de 15 min sur un titre vu).
5. **Candidats** : recommandations TMDB des 12 titres les plus aimés + populaires des 3 genres favoris.
6. **Classement** : proximité au profil + soutien des titres sources + note TMDB, diversité (raison et source),
   affinage des 40 premiers avec leurs traits complets, 30 gardés. Raison affichée : source + trait (personne > genre > thème).
7. **Quand** : 90 s après une modification, chaque nuit à 4 h, ou à la demande (fin du premier lancement).
   Résultats stockés dans `taste_results`, l'accueil les lit sans calcul.

## Direction visuelle

- **Neumorphism pour le sol** : une seule surface (`--surface`), le relief vient de deux ombres (`--raised`, `--inset`…).
  Cartes, affiches, épisodes, champs, pistes des sélecteurs, grille bento.
- **Verre liquide pour ce qui flotte** : barre de navigation, panneaux des bannières, barre du premier lancement.
  `web/src/shared/glass/` greffe la librairie `public/vendor/liquid-glass` (dashersw/liquid-glass-js, MIT) sur un élément
  React (`useGlass`). La page est photographiée par html2canvas (`glass-snapshot.ts`), reprise quand le DOM, les images,
  la taille ou le thème changent. Texte adaptatif (`.on-light`) selon la luminosité derrière le verre.
- Patches locaux de la librairie (repérés « patch design-lab » / « patch FluxTube ») : shaders en `highp` et sans
  `dot(axe, axe)` (les pilules se réduisaient à une bulle sur GPU réel), réfraction à l'échelle de l'élément, alpha
  prémultiplié, `window.Container` exposé.
- Contraintes : pas de `color-mix()` dans le CSS (html2canvas ne le lit pas) ; au plus une poignée de verres simultanés
  (limite d'environ 16 contextes WebGL par page).

## Données

SQLite (`data/fluxtube.db`, WAL). Signaux conservés pour les futures recommandations : `title_users.added_at`
comparé à `titles.created_at` (s'ajouter juste après la création ≈ déjà vu ensemble), notes, statuts, langues.
