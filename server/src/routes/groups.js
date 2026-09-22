// server/src/routes/groups.js
const express = require("express");
const { query } = require("../db");

const router = express.Router();

// GET /api/groups — liste des groupes avec leurs équipes
router.get("/", async (req, res, next) => {
  try {
    const groups = await query("SELECT id, name FROM groups ORDER BY name");
    const teams = await query(
      "SELECT id, name, code, flag, confederation, fifa_rank, group_id FROM teams ORDER BY name"
    );
    const result = groups.map((g) => ({ ...g, teams: teams.filter((t) => t.group_id === g.id) }));
    res.json({ count: result.length, groups: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
