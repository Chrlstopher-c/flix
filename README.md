# FluxTube

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

Au premier lancement, si `FLUXTUBE_USERS` est vide, deux comptes sont créés avec des mots de passe aléatoires
affichés dans `logs/server.log`. Chacun peut ensuite changer son nom et son mot de passe dans Réglages.

Développement : `pnpm dev:server` + `pnpm dev:web` (Vite sur :5190, proxy vers l'API).

## Ports

| Service | Port |
|---|---|
| Serveur (API + front compilé) | `PORT`, 8490 par défaut |
| Vite (dev) | 5190 |

Ce projet utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
