# Flix

Une web app à deux pour gérer ensemble ses films, séries et animés : listes, statut de chacun, épisodes cochés,
points d'arrêt, moments marquants horodatés, avis, étiquettes, version regardée (audio / sous-titres), fiches
acteurs avec filmographie. Catalogue et images fournis par [TMDB](https://www.themoviedb.org) (API gratuite).

Tout est local : SQLite, cache des réponses TMDB et des images sur disque. Pensé pour tourner sur un Raspberry Pi.

## Stack

- Serveur : Bun (`Bun.serve`, `bun:sqlite`), pino
- Front : React 19 + Vite, React Router, Framer Motion, GSAP ScrollTrigger
- Typo : Fraunces + Geist (auto-hébergées)

## Lancer

```bash
cp .env.example .env      # renseigner TMDB_API_KEY
./start.sh                # installe, compile, lance → http://localhost:8490
./stop.sh / ./restart.sh
```

Au premier lancement, si `FLIX_USERS` est vide, deux comptes sont créés avec des mots de passe aléatoires
affichés dans `logs/server.log`. Chacun peut ensuite changer son nom et son mot de passe dans Réglages.

Déploiement : `./deploy.sh` (cible dans `.env.deploy`, non suivi : `DEPLOY_HOST`, `DEPLOY_DIR`, `DEPLOY_SERVICE`).

Développement : `pnpm dev:server` + `pnpm dev:web` (Vite sur :5190, proxy vers l'API).

## MCP (Claude)

Chaque compte génère sa clé dans Réglages → « Flix pour Claude ». Endpoint `POST /mcp` (clé en `Authorization: Bearer`)
ou `POST /mcp/<clé>` pour les clients qui n'acceptent qu'une URL. Les outils n'agissent que sur le compte de la clé.

```bash
claude mcp add --transport http flix https://<votre-domaine>/mcp --header "Authorization: Bearer <clé>"
```

## Ports

| Service | Port |
|---|---|
| Serveur (API + front compilé) | `PORT`, 8490 par défaut |
| Vite (dev) | 5190 |

Ce projet utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
