# Déploiement — FIFA26 / Control

Trois étapes, comme demandé : **GitHub** (dépôt du code) → **Supabase**
(toute la donnée) → **Cloudflare Pages** (mise en ligne du site par
téléversement direct du dossier généré). Pas d'autre plateforme.

---

## 1. GitHub — déposer le projet

```bash
git init
git add .
git commit -m "Initial commit — FIFA26 / Control"
git branch -M main
git remote add origin https://github.com/<votre-compte>/<votre-repo>.git
git push -u origin main
```

`node_modules/`, `.env`, `.next/` et `out/` sont déjà exclus par les
`.gitignore` fournis (racine et `server/`).

---

## 2. Supabase — la base de données

1. Créez un compte sur [supabase.com](https://supabase.com) → **New project**.
   Notez le mot de passe de base de données que vous choisissez à cette étape.
2. Une fois le projet prêt, allez dans **Project Settings → Database →
   Connection string → URI**. Copiez cette chaîne (remplacez
   `[YOUR-PASSWORD]` par le mot de passe choisi à l'étape 1) — c'est votre
   `DATABASE_URL`. Pour la production, préférez le mode **Transaction
   pooler** (port `6543`), plus adapté à une API qui reçoit beaucoup de
   petites requêtes.
3. Allez dans **Project Settings → API**. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. (Optionnel) Dans **Authentication → Providers → Email**, désactivez
   « Confirm email » si vous voulez que les comptes supporters créés sur
   `/connexion` soient utilisables immédiatement, sans validation par email
   (pratique pour une démonstration).
5. Le schéma (tables `teams`, `matches`, `players`, etc.) est créé
   automatiquement au premier démarrage de l'API — rien à faire manuellement
   dans l'éditeur SQL. Il suffit de renseigner `DATABASE_URL` et de lancer :

   ```bash
   cd server
   cp .env.example .env
   # éditez .env : collez votre DATABASE_URL Supabase, un JWT_SECRET aléatoire
   npm install
   npm run seed
   ```

   `npm run seed` crée le schéma (s'il n'existe pas déjà), puis insère les 12
   groupes, 48 équipes, 16 stades, 20 arbitres, les effectifs et un compte
   organisateur (`admin@fifa26.control` / `ChangeMoi123!` par défaut — à
   changer via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` dans `.env`).

6. Démarrez l'API : `npm run dev` (ou `npm start`). Elle écoute par défaut
   sur `http://localhost:4000` et sert désormais ses données depuis Supabase.

   > **Où faire tourner l'API en continu ?** Le cahier des charges impose
   > « Node.js + Express » côté serveur : c'est un processus qui doit
   > rester actif pour répondre aux requêtes. Cloudflare Pages, qui accueille
   > le frontend à l'étape 3, ne fait pas tourner ce genre de processus (il
   > sert uniquement des fichiers statiques). Faites donc tourner `server/`
   > sur n'importe quelle machine capable d'exécuter `node` en continu — un
   > PC/serveur que vous laissez allumé pour la démonstration, une machine
   > de votre établissement, ou tout hébergeur Node de votre choix. Le code
   > est strictement le même partout ; seule la variable `NEXT_PUBLIC_API_URL`
   > (étape 3) doit pointer vers l'adresse où elle tourne.

---

## 3. Cloudflare Pages — mise en ligne du frontend (téléversement direct)

1. Générez le site statique :

   ```bash
   cp .env.example .env.local
   # éditez .env.local :
   #   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY  (étape 2.3)
   #   NEXT_PUBLIC_API_URL  → l'adresse de votre API (étape 2.6)
   npm install
   npm run build
   ```

   Cela crée un dossier **`out/`** à la racine du projet : un site 100 %
   statique (HTML/CSS/JS), sans serveur Node requis pour l'afficher.

2. Allez sur [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers
   & Pages** → **Create application** → onglet **Pages** → **Upload assets**.
3. Donnez un nom au projet (ex. `fifa26-control`), puis **glissez-déposez le
   dossier `out/`** (ou son contenu) dans la zone de téléversement. Cloudflare
   met le site en ligne immédiatement sur une URL du type
   `https://fifa26-control.pages.dev`.
4. Retournez dans `server/.env` et mettez à jour `CORS_ORIGIN` avec cette
   URL exacte, puis redémarrez l'API (`npm run dev` / `npm start`).

### Mettre à jour le site après une modification

Relancez `npm run build`, puis, dans le même projet Cloudflare Pages,
**Deployments → Create deployment → Upload assets**, et déposez à nouveau le
dossier `out/`. Un nouveau déploiement est publié sur la même URL.

### Alternative en ligne de commande (Wrangler)

Si vous préférez la ligne de commande au glisser-déposer :

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy out --project-name=fifa26-control
```

---

## Vérifications

1. Ouvrez votre URL `*.pages.dev` : le calendrier, le classement et les
   statistiques doivent se charger (données servies par votre API Express /
   Supabase). Si une bannière rouge « API indisponible » apparaît, vérifiez
   `NEXT_PUBLIC_API_URL` et `CORS_ORIGIN`.
2. `/admin` : connectez-vous avec le compte créé par le seed, enregistrez un
   score puis un but — le classement et les meilleurs buteurs doivent se
   mettre à jour immédiatement sur la page d'accueil.
3. `/connexion` : créez un compte supporter — géré entièrement par Supabase
   Auth.
4. Dans le tableau de bord Supabase → **Table Editor**, vous devez voir les
   tables `teams`, `matches`, `players`, etc. remplies par le seed.

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Bannière rouge « API indisponible » | `NEXT_PUBLIC_API_URL` absent/faux, ou API arrêtée | Vérifiez que `server/` tourne et que l'URL est correcte |
| Erreur CORS dans la console du navigateur | `CORS_ORIGIN` ne correspond pas à l'URL `.pages.dev` | Mettez à jour `server/.env` puis redémarrez l'API |
| `npm run seed` échoue avec une erreur de connexion | `DATABASE_URL` incorrect | Recopiez la chaîne depuis Supabase → Database → Connection string |
| Le classement reste à zéro | Aucun match `TERMINE` | Enregistrez un score depuis `/admin` |
| Compte supporter créé mais connexion impossible | Confirmation par email activée sur Supabase | Désactivez-la (étape 2.4) ou validez l'email reçu |

## Développement local (rappel)

```bash
# Terminal 1 — backend (Supabase)
cd server && cp .env.example .env   # renseignez DATABASE_URL
npm install && npm run seed && npm run dev     # http://localhost:4000

# Terminal 2 — frontend
cp .env.example .env.local          # renseignez les clés Supabase + API URL
npm install && npm run dev           # http://localhost:3000
```
