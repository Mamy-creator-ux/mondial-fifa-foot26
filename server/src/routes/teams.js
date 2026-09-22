// server/src/routes/teams.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const { query, queryOne } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/teams?group=A
router.get("/", async (req, res, next) => {
  try {
    const { group } = req.query;
    let rows;
    if (group) {
      rows = await query(
        `SELECT teams.*, groups.name AS group_name FROM teams
         JOIN groups ON groups.id = teams.group_id
         WHERE groups.name = $1 OR groups.name = $2
         ORDER BY teams.name`,
        [`Groupe ${group}`, group]
      );
    } else {
      rows = await query(
        `SELECT teams.*, groups.name AS group_name FROM teams
         LEFT JOIN groups ON groups.id = teams.group_id
         ORDER BY groups.name, teams.name`
      );
    }
    res.json({ count: rows.length, teams: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/teams/:id
router.get("/:id", async (req, res, next) => {
  try {
    const team = await queryOne("SELECT * FROM teams WHERE id = $1", [req.params.id]);
    if (!team) return res.status(404).json({ error: "Équipe introuvable." });
    res.json({ team });
  } catch (err) {
    next(err);
  }
});

// POST /api/teams — protégé (admin/editeur)
router.post(
  "/",
  requireAuth,
  requireRole("admin", "editeur"),
  body("name").trim().notEmpty(),
  body("code").trim().isLength({ min: 2, max: 4 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { name, code, flag, group_id, confederation, fifa_rank } = req.body;
      const team = await queryOne(
        `INSERT INTO teams (name, code, flag, group_id, confederation, fifa_rank)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [name, code.toUpperCase(), flag || null, group_id || null, confederation || null, fifa_rank || null]
      );
      res.status(201).json({ team });
    } catch (e) {
      if (e.code === "23505") return res.status(409).json({ error: "Cette équipe existe déjà." });
      next(e);
    }
  }
);

// PUT /api/teams/:id — protégé
router.put("/:id", requireAuth, requireRole("admin", "editeur"), async (req, res, next) => {
  try {
    const existing = await queryOne("SELECT * FROM teams WHERE id = $1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Équipe introuvable." });

    const merged = { ...existing, ...req.body };
    const team = await queryOne(
      "UPDATE teams SET name=$1, code=$2, flag=$3, group_id=$4, confederation=$5, fifa_rank=$6 WHERE id=$7 RETURNING *",
      [merged.name, merged.code, merged.flag, merged.group_id, merged.confederation, merged.fifa_rank, req.params.id]
    );
    res.json({ team });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teams/:id — protégé (admin uniquement)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM teams WHERE id = $1 RETURNING id", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Équipe introuvable." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
