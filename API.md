# API REST — FIFA26 / Control

Base URL locale : `http://localhost:4000`

Toutes les réponses sont en JSON. Les routes protégées attendent un en-tête
`Authorization: Bearer <token>` obtenu via `/api/auth/login`.

## Authentification

| Méthode | Route | Description | Protégée |
|---|---|---|---|
| POST | `/api/auth/register` | Crée un compte (`admin` ou `editeur`) | non* |
| POST | `/api/auth/login` | Connexion, renvoie `{ token, user }` | non |
| GET | `/api/auth/me` | Utilisateur courant (vérifie le jeton) | oui |

`*` En production, désactivez ou protégez `/api/auth/register` (par ex.
derrière une clé d'invitation) pour éviter la création libre de comptes
admin — voir commentaire dans `server/src/routes/auth.js`.

**Exemple :**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fifa26.control","password":"ChangeMoi123!"}'
```

## Groupes & équipes

| Méthode | Route | Description | Protégée |
|---|---|---|---|
| GET | `/api/groups` | Les 12 groupes avec leurs équipes | non |
| GET | `/api/teams?group=A` | Équipes (filtrable par groupe) | non |
| GET | `/api/teams/:id` | Détail d'une équipe | non |
| POST | `/api/teams` | Créer une équipe | oui (admin/editeur) |
| PUT | `/api/teams/:id` | Modifier une équipe | oui (admin/editeur) |
| DELETE | `/api/teams/:id` | Supprimer une équipe | oui (admin) |

## Matchs

| Méthode | Route | Description | Protégée |
|---|---|---|---|
| GET | `/api/matches?group=A&status=TERMINE&team=Brésil` | Liste filtrable | non |
| GET | `/api/matches/:id` | Détail d'un match | non |
| POST | `/api/matches` | Programmer un match | oui |
| PATCH | `/api/matches/:id/score` | Enregistrer un score → **recalcule le classement** | oui |
| PUT | `/api/matches/:id` | Modifier un match (horaire, stade, statut…) | oui |
| DELETE | `/api/matches/:id` | Supprimer un match | oui (admin) |

`status` possibles : `PROGRAMME`, `EN_COURS`, `TERMINE`, `REPORTE`.

**Exemple — enregistrer un score :**
```bash
curl -X PATCH http://localhost:4000/api/matches/1/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"home_score":2,"away_score":1}'
```
La réponse inclut immédiatement le classement à jour du groupe concerné.

## Classement (calcul automatique)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/standings` | Classement de tous les groupes |
| GET | `/api/standings/A` | Classement d'un seul groupe |

Le classement n'est **jamais stocké** : il est recalculé à chaque appel à
partir des matchs `TERMINE` (points, différence de buts, buts marqués,
forme sur les 5 derniers matchs). Voir `server/src/utils/standings.js`.

## Statistiques joueurs (calculées automatiquement)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/stats` | Statistiques agrégées de tous les joueurs ayant au moins un événement |
| GET | `/api/stats/top-scorers?limit=10` | Meilleur(s) buteur(s) |
| GET | `/api/stats/discipline?limit=10` | Joueurs les plus sanctionnés (cartons) |
| GET | `/api/stats/player/:id` | Fiche complète d'un joueur (infos + stats + historique d'événements) |

Les statistiques ne sont **jamais stockées** : elles sont recalculées à
chaque appel par agrégation de `match_events` (voir section suivante). Il est
donc impossible qu'un but ou un carton comptabilisé se désynchronise des
événements réellement enregistrés.

## Joueurs & entraîneurs

| Méthode | Route | Description | Protégée |
|---|---|---|---|
| GET | `/api/players?team_id=1` | Effectif (filtrable par équipe) | non |
| GET | `/api/players/:id` | Détail d'un joueur | non |
| POST | `/api/players` | Ajouter un joueur | oui |
| PUT | `/api/players/:id` | Modifier un joueur | oui |
| DELETE | `/api/players/:id` | Supprimer un joueur | oui (admin) |
| GET | `/api/coaches?team_id=1` | Entraîneur(s) (filtrable par équipe) | non |
| POST | `/api/coaches` | Ajouter un entraîneur | oui |
| PUT | `/api/coaches/:id` | Modifier | oui |
| DELETE | `/api/coaches/:id` | Supprimer | oui (admin) |

## Événements de match — buts, cartons, passes décisives

| Méthode | Route | Description | Protégée |
|---|---|---|---|
| GET | `/api/events?match_id=1` | Événements d'un match, triés par minute | non |
| GET | `/api/events?player_id=4` | Historique d'un joueur | non |
| POST | `/api/events` | Enregistrer un événement (`BUT`, `CARTON_JAUNE`, `CARTON_ROUGE`, `PASSE_DECISIVE`) | oui |
| DELETE | `/api/events/:id` | Supprimer un événement | oui |

Chaque événement enregistré via `POST /api/events` génère automatiquement une
notification (voir section suivante) et met immédiatement à jour les
statistiques calculées (`/api/stats/*`).

**Exemple — enregistrer un but :**
```bash
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"match_id":1,"team_id":1,"player_id":4,"type":"BUT","minute":55}'
```

## Arbitres & stades

| Méthode | Route | Description | Protégée |
|---|---|---|---|
| GET | `/api/referees` | Liste des arbitres | non |
| POST | `/api/referees` | Ajouter un arbitre | oui |
| PUT / DELETE | `/api/referees/:id` | Modifier / supprimer | oui |
| GET | `/api/stadiums` | Liste des stades | non |
| POST | `/api/stadiums` | Ajouter un stade | oui |
| PUT / DELETE | `/api/stadiums/:id` | Modifier / supprimer | oui |

Un match peut référencer un stade (`stadium_id`) et un arbitre
(`referee_id`) ; les réponses de `/api/matches` incluent `stadium_name`,
`stadium_capacity` et `referee_name` déjà joints.

## Notifications (fil d'actualité en direct)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/notifications?since=<ISO>&limit=20` | Notifications récentes (buts, cartons, résultats) |

Conçu pour être interrogé par **polling côté client** (Fetch API, toutes les
15 secondes dans le frontend fourni) afin d'obtenir une mise à jour sans
rechargement de page. Le paramètre `since` permet de ne récupérer que les
notifications apparues après un jeton temporel donné.

## Codes d'erreur

| Code | Signification |
|---|---|
| 400 | Requête invalide (validation échouée) |
| 401 | Jeton manquant ou invalide |
| 403 | Rôle insuffisant |
| 404 | Ressource introuvable |
| 409 | Conflit (ex : email déjà utilisé) |
| 429 | Trop de requêtes (rate limit) |
| 500 | Erreur serveur |
