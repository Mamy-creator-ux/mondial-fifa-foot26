// server/src/routes/matches.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const { query, queryOne } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { computeStandingsForGroup } = require("../utils/standings");

const router = express.Router();

const MATCH_SELECT = `
  SELECT matches.*,
         ht.name AS home_team, ht.code AS home_code, ht.flag AS home_flag,
         at.name AS away_team, at.code AS away_code, at.flag AS away_flag,
         groups.name AS group_name,
         referees.name AS referee_name,
         st.name AS stadium_name, st.capacity AS stadium_capacity
  FROM matches
  JOIN teams ht ON ht.id = matches.home_team_id
  JOIN teams at ON at.id = matches.away_team_id
  LEFT JOIN groups ON groups.id = matches.group_id
  LEFT JOIN referees ON referees.id = matches.referee_id
  LEFT JOIN stadiums st ON st.id = matches.stadium_id
`;

// GET /api/matches?group=A&status=TERMINE&team=Brésil
router.get("/", async (req, res, next) => {
  try {
    const { group, status, team } = req.query;
    const clauses = [];
    const params = [];

    if (group) {
      params.push(`Groupe ${group}`, group);
      clauses.push(`(groups.name = $${params.length - 1} OR groups.name = $${params.length})`);
    }
    if (status) {
      params.push(status.toUpperCase());
      clauses.push(`matches.status = $${params.length}`);
    }
    if (team) {
      params.push(team, team);
      clauses.push(`(ht.name = $${params.length - 1} OR at.name = $${params.length})`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await query(`${MATCH_SELECT} ${where} ORDER BY matches.kickoff_at ASC`, params);
    res.json({ count: rows.length, matches: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await queryOne(`${MATCH_SELECT} WHERE matches.id = $1`, [req.params.id]);
    if (!row) return res.status(404).json({ error: "Match introuvable." });
    res.json({ match: row });
  } catch (err) {
    next(err);
  }
});

// POST /api/matches — protégé
router.post(
  "/",
  requireAuth,
  requireRole("admin", "editeur"),
  body("home_team_id").isInt(),
  body("away_team_id").isInt(),
  body("kickoff_at").isISO8601(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { home_team_id, away_team_id, group_id, stadium, city, stadium_id, referee_id, kickoff_at, round } = req.body;
      if (Number(home_team_id) === Number(away_team_id)) {
        return res.status(400).json({ error: "Une équipe ne peut pas jouer contre elle-même." });
      }

      const inserted = await queryOne(
        `INSERT INTO matches (group_id, home_team_id, away_team_id, stadium, city, stadium_id, referee_id, kickoff_at, round, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PROGRAMME') RETURNING id`,
        [
          group_id || null,
          home_team_id,
          away_team_id,
          stadium || null,
          city || null,
          stadium_id || null,
          referee_id || null,
          kickoff_at,
          round || "Phase de groupes",
        ]
      );

      const match = await queryOne(`${MATCH_SELECT} WHERE matches.id = $1`, [inserted.id]);
      res.status(201).json({ match });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/matches/:id/score — enregistre un score → le classement se
// recalcule automatiquement à la prochaine lecture (GET /api/standings),
// aucune étape manuelle n'est nécessaire.
router.patch(
  "/:id/score",
  requireAuth,
  requireRole("admin", "editeur"),
  body("home_score").isInt({ min: 0 }),
  body("away_score").isInt({ min: 0 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: "Scores invalides (entiers ≥ 0 requis)." });

      const match = await queryOne("SELECT * FROM matches WHERE id = $1", [req.params.id]);
      if (!match) return res.status(404).json({ error: "Match introuvable." });

      const { home_score, away_score, status } = req.body;
      const finalStatus = status || "TERMINE";
      await query(
        "UPDATE matches SET home_score=$1, away_score=$2, status=$3, updated_at=now() WHERE id=$4",
        [home_score, away_score, finalStatus, req.params.id]
      );

      const updated = await queryOne(`${MATCH_SELECT} WHERE matches.id = $1`, [req.params.id]);
      const standings = match.group_id ? await computeStandingsForGroup(match.group_id) : [];

      if (finalStatus === "TERMINE") {
        await query("INSERT INTO notifications (type, title, message, match_id) VALUES ($1,$2,$3,$4)", [
          "RESULTAT",
          "🏁 Résultat final",
          `${updated.home_flag ?? ""} ${updated.home_team} ${home_score} – ${away_score} ${updated.away_team} ${updated.away_flag ?? ""}`.trim(),
          updated.id,
        ]);
      }

      res.json({ match: updated, standings });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/matches/:id — modification générale (horaire, stade, statut…)
router.put("/:id", requireAuth, requireRole("admin", "editeur"), async (req, res, next) => {
  try {
    const existing = await queryOne("SELECT * FROM matches WHERE id = $1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Match introuvable." });

    const merged = { ...existing, ...req.body };
    await query(
      `UPDATE matches SET group_id=$1, home_team_id=$2, away_team_id=$3, stadium=$4, city=$5, stadium_id=$6, referee_id=$7, kickoff_at=$8, round=$9, status=$10, home_score=$11, away_score=$12, updated_at=now()
       WHERE id=$13`,
      [
        merged.group_id,
        merged.home_team_id,
        merged.away_team_id,
        merged.stadium,
        merged.city,
        merged.stadium_id,
        merged.referee_id,
        merged.kickoff_at,
        merged.round,
        merged.status,
        merged.home_score,
        merged.away_score,
        req.params.id,
      ]
    );

    const match = await queryOne(`${MATCH_SELECT} WHERE matches.id = $1`, [req.params.id]);
    res.json({ match });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/matches/:id — protégé (admin uniquement)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM matches WHERE id = $1 RETURNING id", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Match introuvable." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
