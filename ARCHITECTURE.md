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
| `web/src/app/` | Montage, routage, navigation. |
| `web/src/shared/` | Design system (CSS, composants génériques), client API, utilitaires de langue et libellés. |
| `web/src/<page>/` | Une tranche verticale par écran : `home`, `library`, `search`, `title`, `person`, `settings`, `auth`. |

## Règles de frontière

- Un domaine serveur n'importe que `core/` et l'API publique (fonctions exportées) d'un autre domaine.
- `library/routes.ts` est le seul point d'entrée HTTP de `library/` et `progress/`.
- Le front ne parle au serveur que via `shared/api.ts`.
- Toute requête TMDB passe par `tmdb/client.ts` (cache obligatoire), toute image par `/img/…` (copie locale).

## Données

SQLite (`data/fluxtube.db`, WAL). Signaux conservés pour les futures recommandations : `title_users.added_at`
comparé à `titles.created_at` (s'ajouter juste après la création ≈ déjà vu ensemble), notes, statuts, langues.
