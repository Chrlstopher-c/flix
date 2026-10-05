# État — Flix

## 2026-10-05 — V1
- Comptes (nom + mot de passe), réglages (renommer, changer de mot de passe avec confirmation), thème clair/sombre.
- Recherche TMDB (titres + personnes), tendances, populaires par type (films, séries, animés).
- Bibliothèque commune : statut, note /10, version regardée (audio + sous-titres) par personne ; étiquettes partagées ;
  filtres type / personne / statut / étiquette / langue, tris.
- Fiche titre : langues (originale, parlées, traductions de la fiche), épisodes cochés (« vu jusqu'ici »),
  point d'arrêt épisode + instant, moments horodatés et avis avec version, distribution, recommandations.
- Fiche personne : biographie, filmographie complète filtrable.
- Limite connue : TMDB ne fournit pas les doublages disponibles ; la version est saisie par l'utilisateur.

## 2026-10-05 — Recommandations
- Moteur `server/taste/` : profil par personne, profil duo, « vu ensemble », raisons affichées, calcul de fond.
- Accueil : « Choisi pour toi » en bannière, rangées Pour toi / Pour toi et l'autre / Parce que tu as aimé X.
- Premier lancement `/decouverte` : noter vite des titres connus (j'adore, aimé, pas aimé, à voir).

## 2026-10-05 — Direction visuelle
- Neumorphism (sol) + verre liquide (flottant) + grille bento sur l'accueil (`/api/dashboard`).

## 2026-10-05 — Flix
- Renommage FluxTube → Flix (base renommée automatiquement, ancienne adresse redirigée via `REDIRECT_HOSTS`).
- MCP intégré : clé par compte dans Réglages, 12 outils (recherche, fiche, bibliothèque, écriture, recos perso + duo).
- Recalcul des goûts 20 s après la dernière modification (au plus 60 s), langue originale par défaut, défilement infini.

## 2026-10-05 — Cercle d'amis
- Inscription par clé d'invitation (créée au 1er démarrage, visible et renouvelable dans Réglages, lien `/?invite=`).
- Plusieurs comptes : duo calculé pour chaque paire, sélecteur de partenaire sur l'accueil, filtres par personne.
- Suggestions : bouton « Suggérer à… » sur les fiches, rangée « Suggéré pour toi », outils MCP `my_suggestions` /
  `suggest_title`. Limiteur : 10 échecs de connexion/inscription par IP et par quart d'heure.

## Suite
Voir TODO.md.
