// server/src/server.js
// -----------------------------------------------------------------------------
// Point d'entrée du backend Node.js + Express — API REST de la plateforme
// FIFA26 / Control (équipes, matchs, classement automatique, statistiques,
// authentification).
// -----------------------------------------------------------------------------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const teamsRoutes = require("./routes/teams");
const matchesRoutes = require("./routes/matches");
const standingsRoutes = require("./routes/standings");
const statsRoutes = require("./routes/stats");
const groupsRoutes = require("./routes/groups");
const stadiumsRoutes = require("./routes/stadiums");
const refereesRoutes = require("./routes/referees");
const playersRoutes = require("./routes/players");
const coachesRoutes = require("./routes/coaches");
const eventsRoutes = require("./routes/events");
const notificationsRoutes = require("./routes/notifications");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { migrate } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Non autorisé par la politique CORS."));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Limite globale anti-abus (les routes de login ont leur propre limite plus stricte)
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/", (req, res) => {
  res.json({
    name: "FIFA26 / Control API",
    status: "ok",
    docs: "/api",
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "API REST — Championnat de football (Coupe du Monde 2026)",
    endpoints: {
      auth: ["POST /api/auth/register", "POST /api/auth/login", "GET /api/auth/me"],
      groups: ["GET /api/groups"],
      teams: ["GET /api/teams", "GET /api/teams/:id", "POST /api/teams", "PUT /api/teams/:id", "DELETE /api/teams/:id"],
      matches: [
        "GET /api/matches",
        "GET /api/matches/:id",
        "POST /api/matches",
        "PATCH /api/matches/:id/score",
        "PUT /api/matches/:id",
        "DELETE /api/matches/:id",
      ],
      standings: ["GET /api/standings", "GET /api/standings/:group"],
      stats: [
        "GET /api/stats",
        "GET /api/stats/top-scorers",
        "GET /api/stats/discipline",
        "GET /api/stats/player/:id",
      ],
      stadiums: ["GET /api/stadiums", "GET /api/stadiums/:id", "POST /api/stadiums", "PUT /api/stadiums/:id", "DELETE /api/stadiums/:id"],
      referees: ["GET /api/referees", "GET /api/referees/:id", "POST /api/referees", "PUT /api/referees/:id", "DELETE /api/referees/:id"],
      players: ["GET /api/players", "GET /api/players/:id", "POST /api/players", "PUT /api/players/:id", "DELETE /api/players/:id"],
      coaches: ["GET /api/coaches", "POST /api/coaches", "PUT /api/coaches/:id", "DELETE /api/coaches/:id"],
      events: ["GET /api/events", "POST /api/events", "DELETE /api/events/:id"],
      notifications: ["GET /api/notifications"],
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/standings", standingsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/stadiums", stadiumsRoutes);
app.use("/api/referees", refereesRoutes);
app.use("/api/players", playersRoutes);
app.use("/api/coaches", coachesRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(notFound);
app.use(errorHandler);

migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚽  FIFA26 / Control API — http://localhost:${PORT}`);
      console.log(`   Base de données : Supabase (PostgreSQL)`);
    });
  })
  .catch((err) => {
    console.error("❌ Impossible d'initialiser le schéma sur Supabase :", err.message);
    console.error("   Vérifiez DATABASE_URL dans server/.env (Supabase → Project Settings → Database).");
    process.exit(1);
  });

module.exports = app;
