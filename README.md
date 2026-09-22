# FIFA26 / Control

Plateforme de gestion de championnat de football (Coupe du Monde 2026) —
frontend Next.js (export statique) avec animations avancées, backend
Node.js + Express fournissant une API REST complète (équipes, joueurs,
entraîneurs, matchs, classement automatique, statistiques, arbitres,
stades, notifications, authentification), et **Supabase (PostgreSQL)**
comme base de données unique pour toute la plateforme.

**Mise en ligne :** dépôt GitHub → base de données Supabase → frontend
téléversé directement sur Cloudflare Pages. Voir [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Structure du projet

```
.
├── app/                    # Frontend Next.js (App Router, export statique)
│   ├── page.tsx            # Page d'accueil (hero, calendrier interactif, classement, stats)
│   ├── admin/page.tsx      # Espace organisateur (résultats, événements, effectifs, stades/arbitres)
│   ├── equipes/page.tsx    # Effectifs publics : joueurs & entraîneurs par équipe
│   └── connexion/page.tsx  # Espace supporter (Supabase Auth)
├── components/              # Cursor, reveal/marquee/chrome, calendrier interactif, notifications
├── lib/
│   ├── api.ts               # Client typé pour l'API Express
│   └── supabase.ts          # Client Supabase (auth supporter côté navigateur)
├── server/                   # Backend Node.js + Express
│   ├── src/db/              # Connexion PostgreSQL (Supabase), schéma + migrations
│   ├── src/routes/          # auth, teams, players, coaches, matches, events, standings, stats, stadiums, referees, notifications
│   ├── src/utils/standings.js  # Calcul automatique du classement
│   └── src/data/seed.js     # 12 groupes / 48 équipes réelles + effectifs, stades, arbitres, calendrier
├── API.md                   # Référence de l'API REST
└── DEPLOYMENT.md            # Guide GitHub → Supabase → Cloudflare Pages
```

## Démarrage rapide

```bash
# 1. Backend (nécessite un projet Supabase — voir DEPLOYMENT.md §2)
cd server
cp .env.example .env      # renseignez DATABASE_URL (Supabase)
npm install
npm run seed                # crée le schéma + 12 groupes, 48 équipes, compte admin
npm run dev                  # http://localhost:4000

# 2. Frontend (dans un second terminal, à la racine du projet)
cp .env.example .env.local  # renseignez les clés Supabase + NEXT_PUBLIC_API_URL
npm install
npm run dev                  # http://localhost:3000
```

Compte organisateur de démonstration (créé par `npm run seed`) :
`admin@fifa26.control` / `ChangeMoi123!` — à changer immédiatement en
production via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

## Deux espaces d'authentification, volontairement séparés

- **`/connexion`** — comptes **supporters** (inscription libre), gérés
  directement par **Supabase Auth** (`lib/supabase.ts`). Pensé pour la
  partie publique du site.
- **`/admin`** — accès **organisateur** (saisie des scores, événements,
  effectifs, stades, arbitres), géré par le backend Express avec JWT +
  bcrypt (`server/src/routes/auth.js`), les comptes étant stockés dans la
  même base Supabase (table `users`). Séparé du compte supporter par
  design : l'API Express reste utilisable indépendamment du site (scripts,
  apps mobiles, intégrations tierces).

## Fonctionnalités (cahier des charges)

**Gestion du championnat**
- Gestion des équipes (12 groupes réels, 48 équipes de la Coupe du Monde 2026)
- Inscription et connexion (espace supporter via Supabase Auth, espace organisateur via JWT)
- Gestion des joueurs et des entraîneurs, par équipe (`/equipes` côté public, `/admin` côté gestion)
- Calendrier des matchs et résultats
- **Classement calculé automatiquement** à chaque score enregistré (aucune étape manuelle, aucun classement stocké — toujours recalculé depuis les résultats)
- Buts, cartons jaunes/rouges et passes décisives liés à un match et un joueur précis (`match_events`) ; **meilleur buteur** et statistiques de discipline calculés automatiquement par agrégation SQL, jamais stockés en doublon
- Gestion des arbitres et des stades (ville, capacité), assignables à chaque match
- Comptes utilisateurs et espace administrateur séparé
- Notifications générées automatiquement (but, carton, résultat final), consultées par polling sans rechargement de page
- Recherche et filtres (équipe, groupe, statut, date via le calendrier, texte libre)

**JavaScript côté client**
- Affichage dynamique du classement (onglets par groupe, mise à jour sans rechargement)
- Calendrier interactif (navigation mensuelle, jours cliquables, filtrage des matchs par date)
- Formulaires (connexion, inscription, saisie de scores/événements/effectifs/stades/arbitres)
- Filtres combinés (équipe, groupe, statut, date, recherche texte)
- Statistiques dynamiques (meilleurs buteurs, discipline)
- Tout est consommé via **Fetch API** ; l'interface se met à jour sans rechargement de page (React + polling des notifications toutes les 15s)

**JavaScript côté serveur**
- Node.js + Express, API REST complète
- Authentification JWT (bcrypt, `express-rate-limit`, `express-validator`)
- Calcul automatique du classement (`server/src/utils/standings.js`)
- Gestion des matchs, gestion des statistiques
- Base de données : **Supabase (PostgreSQL)**, via le driver `pg`

Animations avancées : curseur magnétique personnalisé, texte kinétique
révélé au scroll, bandeau défilant infini, horloges live multi-fuseaux,
barre de progression de scroll, transitions de menu — inspirées de la
structure d'interaction de [haoqi.design](https://haoqi.design/). Respecte
`prefers-reduced-motion`, accessible au clavier.

## Documentation

- [`API.md`](./API.md) — référence complète de l'API REST
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — guide GitHub → Supabase → Cloudflare Pages
- [`server/README.md`](./server/README.md) — détails du backend

## Stack technique

**Frontend** : Next.js (App Router, export statique `output: "export"`), TypeScript, Tailwind CSS, Framer Motion, Supabase Auth
**Backend** : Node.js, Express, PostgreSQL via Supabase (`pg`), JWT, bcrypt
**Hébergement** : Cloudflare Pages (frontend, téléversement direct du dossier `out/`) + Supabase (données)
