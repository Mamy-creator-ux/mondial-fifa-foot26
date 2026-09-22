// server/src/routes/notifications.js — fil d'actualité (buts, cartons, fins de
// match). Consommé côté client par polling (Fetch API) pour une mise à jour
// sans rechargement de page.
const express = require("express");
const { query } = require("../db");

const router = express.Router();

// GET /api/notifications?since=2026-06-11T20:00:00.000Z&limit=20
router.get("/", async (req, res, next) => {
  try {
    const { since, limit } = req.query;
    const max = Math.min(Number(limit) || 20, 100);
    const rows = since
      ? await query("SELECT * FROM notifications WHERE created_at > $1 ORDER BY created_at DESC LIMIT $2", [since, max])
      : await query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT $1", [max]);
    res.json({ count: rows.length, notifications: rows, server_time: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
