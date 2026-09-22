// server/src/routes/referees.js — gestion des arbitres
const express = require("express");
const { body, validationResult } = require("express-validator");
const { query, queryOne } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM referees ORDER BY name");
    res.json({ count: rows.length, referees: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const referee = await queryOne("SELECT * FROM referees WHERE id = $1", [req.params.id]);
    if (!referee) return res.status(404).json({ error: "Arbitre introuvable." });
    res.json({ referee });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requireAuth,
  requireRole("admin", "editeur"),
  body("name").trim().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { name, nationality } = req.body;
      const referee = await queryOne(
        "INSERT INTO referees (name, nationality) VALUES ($1,$2) RETURNING *",
        [name, nationality || null]
      );
      res.status(201).json({ referee });
    } catch (err) {
      next(err);
    }
  }
);

router.put("/:id", requireAuth, requireRole("admin", "editeur"), async (req, res, next) => {
  try {
    const existing = await queryOne("SELECT * FROM referees WHERE id = $1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Arbitre introuvable." });
    const merged = { ...existing, ...req.body };
    const referee = await queryOne(
      "UPDATE referees SET name=$1, nationality=$2, matches_officiated=$3 WHERE id=$4 RETURNING *",
      [merged.name, merged.nationality, merged.matches_officiated, req.params.id]
    );
    res.json({ referee });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM referees WHERE id = $1 RETURNING id", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Arbitre introuvable." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
