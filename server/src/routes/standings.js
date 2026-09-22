// server/src/routes/standings.js
const express = require("express");
const { queryOne } = require("../db");
const { computeStandingsForGroup, computeAllStandings } = require("../utils/standings");

const router = express.Router();

// GET /api/standings — classement calculé automatiquement pour tous les groupes
router.get("/", async (req, res, next) => {
  try {
    res.json({ standings: await computeAllStandings() });
  } catch (err) {
    next(err);
  }
});

// GET /api/standings/:group — classement d'un seul groupe (ex: /api/standings/A)
router.get("/:group", async (req, res, next) => {
  try {
    const label = req.params.group.length === 1 ? `Groupe ${req.params.group.toUpperCase()}` : req.params.group;
    const group = await queryOne("SELECT id, name FROM groups WHERE name = $1", [label]);
    if (!group) return res.status(404).json({ error: "Groupe introuvable." });
    res.json({ group_name: group.name, standings: await computeStandingsForGroup(group.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
