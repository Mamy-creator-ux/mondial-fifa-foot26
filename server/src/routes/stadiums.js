// server/src/routes/stadiums.js — gestion des stades
const express = require("express");
const { body, validationResult } = require("express-validator");
const { query, queryOne } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM stadiums ORDER BY name");
    res.json({ count: rows.length, stadiums: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const stadium = await queryOne("SELECT * FROM stadiums WHERE id = $1", [req.params.id]);
    if (!stadium) return res.status(404).json({ error: "Stade introuvable." });
    res.json({ stadium });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requireAuth,
  requireRole("admin", "editeur"),
  body("name").trim().notEmpty(),
  body("city").trim().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { name, city, capacity, image } = req.body;
      const stadium = await queryOne(
        "INSERT INTO stadiums (name, city, capacity, image) VALUES ($1,$2,$3,$4) RETURNING *",
        [name, city, capacity || null, image || null]
      );
      res.status(201).json({ stadium });
    } catch (e) {
      if (e.code === "23505") return res.status(409).json({ error: "Ce stade existe déjà." });
      next(e);
    }
  }
);

router.put("/:id", requireAuth, requireRole("admin", "editeur"), async (req, res, next) => {
  try {
    const existing = await queryOne("SELECT * FROM stadiums WHERE id = $1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Stade introuvable." });
    const merged = { ...existing, ...req.body };
    const stadium = await queryOne(
      "UPDATE stadiums SET name=$1, city=$2, capacity=$3, image=$4 WHERE id=$5 RETURNING *",
      [merged.name, merged.city, merged.capacity, merged.image, req.params.id]
    );
    res.json({ stadium });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM stadiums WHERE id = $1 RETURNING id", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Stade introuvable." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
