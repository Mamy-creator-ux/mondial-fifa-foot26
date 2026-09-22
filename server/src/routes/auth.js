// server/src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const { query, queryOne } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives de connexion. Réessayez plus tard." },
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || "dev-secret-change-me",
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );
}

// POST /api/auth/register — création d'un compte éditeur/admin.
// ⚠️ En production, ne laissez pas cette route ouverte au public : exigez un
// jeton d'invitation, protégez-la avec requireAuth+requireRole("admin"), ou
// désactivez-la après la création des comptes organisateurs nécessaires.
router.post(
  "/register",
  body("name").trim().isLength({ min: 2 }).withMessage("Nom trop court."),
  body("email").isEmail().withMessage("Email invalide.").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Mot de passe : 8 caractères minimum."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { name, email, password, role } = req.body;
      const existing = await queryOne("SELECT id FROM users WHERE email = $1", [email]);
      if (existing) return res.status(409).json({ error: "Un compte existe déjà avec cet email." });

      const hash = bcrypt.hashSync(password, 10);
      const safeRole = role === "admin" ? "admin" : "editeur";
      const user = await queryOne(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role",
        [name, email, hash, safeRole]
      );

      const token = signToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  loginLimiter,
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: "Email ou mot de passe manquant." });

      const { email, password } = req.body;
      const user = await queryOne("SELECT * FROM users WHERE email = $1", [email]);
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: "Identifiants incorrects." });
      }

      const token = signToken(user);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me — vérifie le jeton et renvoie l'utilisateur courant
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
