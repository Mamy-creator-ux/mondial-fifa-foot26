// server/src/routes/stats.js — statistiques des joueurs, calculées
// automatiquement par agrégation des événements de match (match_events).
// Aucune statistique n'est stockée séparément : impossible qu'elle se
// désynchronise des buts/cartons réellement enregistrés.
const express = require("express");
const { query, queryOne } = require("../db");

const router = express.Router();

const BASE = `
  SELECT
    players.id AS player_id,
    players.name AS player_name,
    players.position,
    teams.id AS team_id,
    teams.name AS team_name,
    teams.code AS team_code,
    teams.flag AS team_flag,
    SUM(CASE WHEN match_events.type = 'BUT' THEN 1 ELSE 0 END)::int AS goals,
    SUM(CASE WHEN match_events.type = 'PASSE_DECISIVE' THEN 1 ELSE 0 END)::int AS assists,
    SUM(CASE WHEN match_events.type = 'CARTON_JAUNE' THEN 1 ELSE 0 END)::int AS yellow_cards,
    SUM(CASE WHEN match_events.type = 'CARTON_ROUGE' THEN 1 ELSE 0 END)::int AS red_cards
  FROM match_events
  JOIN players ON players.id = match_events.player_id
  JOIN teams ON teams.id = players.team_id
  GROUP BY players.id, teams.id
`;

// GET /api/stats — statistiques agrégées de tous les joueurs ayant au moins un événement
router.get("/", async (req, res, next) => {
  try {
    const rows = await query(`${BASE} ORDER BY goals DESC, assists DESC`);
    res.json({ count: rows.length, stats: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/top-scorers?limit=10 — meilleur(s) buteur(s)
router.get("/top-scorers", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const rows = await query(`${BASE} HAVING SUM(CASE WHEN match_events.type = 'BUT' THEN 1 ELSE 0 END) > 0 ORDER BY goals DESC, assists DESC LIMIT $1`, [limit]);
    res.json({ count: rows.length, top_scorers: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/discipline?limit=10 — joueurs les plus sanctionnés (cartons)
router.get("/discipline", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const rows = await query(
      `${BASE} HAVING SUM(CASE WHEN match_events.type IN ('CARTON_JAUNE','CARTON_ROUGE') THEN 1 ELSE 0 END) > 0 ORDER BY red_cards DESC, yellow_cards DESC LIMIT $1`,
      [limit]
    );
    res.json({ count: rows.length, discipline: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/player/:id — fiche complète d'un joueur (infos + stats + événements)
router.get("/player/:id", async (req, res, next) => {
  try {
    const player = await queryOne(
      `SELECT players.*, teams.name AS team_name, teams.code AS team_code, teams.flag AS team_flag
       FROM players JOIN teams ON teams.id = players.team_id WHERE players.id = $1`,
      [req.params.id]
    );
    if (!player) return res.status(404).json({ error: "Joueur introuvable." });

    const stats = (await queryOne(`${BASE} HAVING players.id = $1`, [req.params.id])) || {
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
    };
    const events = await query(
      `SELECT match_events.*, matches.kickoff_at FROM match_events
       JOIN matches ON matches.id = match_events.match_id
       WHERE match_events.player_id = $1 ORDER BY matches.kickoff_at DESC`,
      [req.params.id]
    );

    res.json({ player, stats, events });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
