// server/src/routes/events.js — événements de match : buts, cartons jaunes/rouges,
// passes décisives. Chaque événement enregistré génère automatiquement une
// notification (voir insertNotification) — c'est la brique qui alimente en
// temps réel les statistiques joueurs et le fil d'actualité du site.
const express = require("express");
const { body, validationResult } = require("express-validator");
const { query, queryOne } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const SELECT = `
  SELECT match_events.*, players.name AS player_name, teams.name AS team_name, teams.code AS team_code, teams.flag AS team_flag
  FROM match_events
  JOIN teams ON teams.id = match_events.team_id
  LEFT JOIN players ON players.id = match_events.player_id
`;

const LABELS = {
  BUT: "⚽ But",
  CARTON_JAUNE: "🟨 Carton jaune",
  CARTON_ROUGE: "🟥 Carton rouge",
  PASSE_DECISIVE: "🅰️ Passe décisive",
};

async function insertNotification({ match_id, type, title, message }) {
  await query("INSERT INTO notifications (type, title, message, match_id) VALUES ($1,$2,$3,$4)", [
    type,
    title,
    message,
    match_id,
  ]);
}

// GET /api/events?match_id=1
router.get("/", async (req, res, next) => {
  try {
    const { match_id, player_id } = req.query;
    let rows;
    if (match_id) rows = await query(`${SELECT} WHERE match_events.match_id = $1 ORDER BY minute`, [match_id]);
    else if (player_id) rows = await query(`${SELECT} WHERE match_events.player_id = $1`, [player_id]);
    else rows = await query(`${SELECT} ORDER BY match_events.created_at DESC LIMIT 50`);
    res.json({ count: rows.length, events: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/events — enregistre un but / carton, crée la notification associée
router.post(
  "/",
  requireAuth,
  requireRole("admin", "editeur"),
  body("match_id").isInt(),
  body("team_id").isInt(),
  body("type").isIn(["BUT", "CARTON_JAUNE", "CARTON_ROUGE", "PASSE_DECISIVE"]),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { match_id, team_id, player_id, type, minute } = req.body;
      const match = await queryOne("SELECT * FROM matches WHERE id = $1", [match_id]);
      if (!match) return res.status(404).json({ error: "Match introuvable." });

      const inserted = await queryOne(
        "INSERT INTO match_events (match_id, team_id, player_id, type, minute) VALUES ($1,$2,$3,$4,$5) RETURNING id",
        [match_id, team_id, player_id || null, type, minute || null]
      );

      const player = player_id ? await queryOne("SELECT name FROM players WHERE id = $1", [player_id]) : null;
      const team = await queryOne("SELECT name, flag FROM teams WHERE id = $1", [team_id]);
      const who = player ? `${player.name} (${team.name})` : team.name;

      await insertNotification({
        match_id,
        type,
        title: LABELS[type] || type,
        message: `${team.flag ?? ""} ${who} — ${minute ? `${minute}'` : "minute inconnue"}`.trim(),
      });

      const event = await queryOne(`${SELECT} WHERE match_events.id = $1`, [inserted.id]);
      res.status(201).json({ event });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", requireAuth, requireRole("admin", "editeur"), async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM match_events WHERE id = $1 RETURNING id", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Événement introuvable." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
