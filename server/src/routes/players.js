// server/src/routes/players.js — gestion des joueurs (effectifs)
const express = require("express");
const { body, validationResult } = require("express-validator");
const { query, queryOne } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const SELECT = `
  SELECT players.*, teams.name AS team_name, teams.code AS team_code, teams.flag AS team_flag
  FROM players JOIN teams ON teams.id = players.team_id
`;

// GET /api/players?team_id=1
router.get("/", async (req, res, next) => {
  try {
    const { team_id } = req.query;
    const rows = team_id
      ? await query(`${SELECT} WHERE players.team_id = $1 ORDER BY players.number`, [team_id])
      : await query(`${SELECT} ORDER BY teams.name, players.number`);
    res.json({ count: rows.length, players: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const player = await queryOne(`${SELECT} WHERE players.id = $1`, [req.params.id]);
    if (!player) return res.status(404).json({ error: "Joueur introuvable." });
    res.json({ player });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requireAuth,
  requireRole("admin", "editeur"),
  body("team_id").isInt(),
  body("name").trim().notEmpty(),
  body("position").isIn(["GARDIEN", "DEFENSEUR", "MILIEU", "ATTAQUANT"]),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { team_id, name, number, position, birth_date, nationality } = req.body;
      const inserted = await queryOne(
        "INSERT INTO players (team_id, name, number, position, birth_date, nationality) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
        [team_id, name, number || null, position, birth_date || null, nationality || null]
      );
      const player = await queryOne(`${SELECT} WHERE players.id = $1`, [inserted.id]);
      res.status(201).json({ player });
    } catch (err) {
      next(err);
    }
  }
);

router.put("/:id", requireAuth, requireRole("admin", "editeur"), async (req, res, next) => {
  try {
    const existing = await queryOne("SELECT * FROM players WHERE id = $1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Joueur introuvable." });
    const merged = { ...existing, ...req.body };
    await query(
      "UPDATE players SET team_id=$1, name=$2, number=$3, position=$4, birth_date=$5, nationality=$6 WHERE id=$7",
      [merged.team_id, merged.name, merged.number, merged.position, merged.birth_date, merged.nationality, req.params.id]
    );
    const player = await queryOne(`${SELECT} WHERE players.id = $1`, [req.params.id]);
    res.json({ player });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM players WHERE id = $1 RETURNING id", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Joueur introuvable." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
