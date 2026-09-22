// server/src/db/index.js
// -----------------------------------------------------------------------------
// Connexion à la base de données PostgreSQL fournie par Supabase.
// Toute la donnée de la plateforme (équipes, matchs, joueurs, classement...)
// vit dans le projet Supabase configuré via la variable d'environnement
// DATABASE_URL (chaîne de connexion Postgres — voir server/.env.example et
// Supabase → Project Settings → Database → Connection string → "URI").
// -----------------------------------------------------------------------------
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL manquant. Copiez server/.env.example vers server/.env et renseignez la chaîne de connexion Supabase (Project Settings → Database → Connection string)."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase exige TLS ; on ne vérifie pas le certificat pour rester
  // compatible avec les environnements de développement sans CA locale.
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 10,
});

pool.on("error", (err) => {
  console.error("Erreur inattendue du pool PostgreSQL :", err.message);
});

/** Exécute une requête paramétrée ($1, $2...) et renvoie les lignes. */
async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

/** Exécute une requête et renvoie uniquement la première ligne (ou undefined). */
async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0];
}

// ---------------------------------------------------------------------------
// Schéma — créé automatiquement au démarrage si absent (idempotent grâce à
// IF NOT EXISTS). Sur Supabase, ce même script peut aussi être collé tel
// quel dans l'éditeur SQL du tableau de bord si vous préférez l'exécuter
// manuellement une seule fois (voir DEPLOYMENT.md).
// ---------------------------------------------------------------------------
async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','editeur')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      flag TEXT,
      group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      confederation TEXT,
      fifa_rank INTEGER
    );

    CREATE TABLE IF NOT EXISTS stadiums (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      capacity INTEGER,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS referees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      nationality TEXT,
      matches_officiated INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS coaches (
      id SERIAL PRIMARY KEY,
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      nationality TEXT,
      role TEXT NOT NULL DEFAULT 'Sélectionneur'
    );

    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      number INTEGER,
      position TEXT CHECK (position IN ('GARDIEN','DEFENSEUR','MILIEU','ATTAQUANT')),
      birth_date TEXT,
      nationality TEXT
    );

    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      away_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      stadium TEXT,
      city TEXT,
      stadium_id INTEGER REFERENCES stadiums(id) ON DELETE SET NULL,
      referee_id INTEGER REFERENCES referees(id) ON DELETE SET NULL,
      kickoff_at TIMESTAMPTZ NOT NULL,
      round TEXT NOT NULL DEFAULT 'Phase de groupes',
      status TEXT NOT NULL DEFAULT 'PROGRAMME' CHECK (status IN ('PROGRAMME','EN_COURS','TERMINE','REPORTE')),
      home_score INTEGER,
      away_score INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Événements de match : buts, cartons jaunes/rouges, passes décisives —
    -- source de vérité unique pour les statistiques joueurs (calculées).
    CREATE TABLE IF NOT EXISTS match_events (
      id SERIAL PRIMARY KEY,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK (type IN ('BUT','CARTON_JAUNE','CARTON_ROUGE','PASSE_DECISIVE')),
      minute INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Notifications générées automatiquement, consultées par polling côté
    -- client (Fetch API) pour une mise à jour sans rechargement de page.
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_matches_group ON matches(group_id);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_teams_group ON teams(group_id);
    CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_coaches_team ON coaches(team_id);
    CREATE INDEX IF NOT EXISTS idx_events_match ON match_events(match_id);
    CREATE INDEX IF NOT EXISTS idx_events_player ON match_events(player_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
  `);
}

module.exports = { pool, query, queryOne, migrate };
