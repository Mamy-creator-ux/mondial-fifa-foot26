// server/src/routes/coaches.js — gestion des entraîneurs
const express = require("express");
const { body, validationResult } = require("express-validator");
const { query, queryOne } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const SELECT = `
  SELECT coaches.*, teams.name AS team_name, teams.code AS team_code, teams.flag AS team_flag
  FROM coaches JOIN teams ON teams.id = coaches.team_id
`;

router.get("/", async (req, res, next) => {
  try {
    const { team_id } = req.query;
    const rows = team_id
      ? await query(`${SELECT} WHERE coaches.team_id = $1`, [team_id])
      : await query(`${SELECT} ORDER BY teams.name`);
    res.json({ count: rows.length, coaches: rows });
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
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { team_id, name, nationality, role } = req.body;
      const inserted = await queryOne(
        "INSERT INTO coaches (team_id, name, nationality, role) VALUES ($1,$2,$3,$4) RETURNING id",
        [team_id, name, nationality || null, role || "Sélectionneur"]
      );
      const coach = await queryOne(`${SELECT} WHERE coaches.id = $1`, [inserted.id]);
      res.status(201).json({ coach });
    } catch (err) {
      next(err);
    }
  }
);

router.put("/:id", requireAuth, requireRole("admin", "editeur"), async (req, res, next) => {
  try {
    const existing = await queryOne("SELECT * FROM coaches WHERE id = $1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Entraîneur introuvable." });
    const merged = { ...existing, ...req.body };
    await query("UPDATE coaches SET team_id=$1, name=$2, nationality=$3, role=$4 WHERE id=$5", [
      merged.team_id,
      merged.name,
      merged.nationality,
      merged.role,
      req.params.id,
    ]);
    const coach = await queryOne(`${SELECT} WHERE coaches.id = $1`, [req.params.id]);
    res.json({ coach });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM coaches WHERE id = $1 RETURNING id", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Entraîneur introuvable." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
