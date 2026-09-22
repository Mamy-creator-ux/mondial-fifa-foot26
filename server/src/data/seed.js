// server/src/data/seed.js
// -----------------------------------------------------------------------------
// Remplit la base Supabase (PostgreSQL) avec les 12 groupes et 48 équipes
// réelles de la Coupe du Monde FIFA 2026 (tirage au sort officiel), les 16
// stades hôtes, un corps arbitral et des effectifs de démonstration, un
// compte administrateur, et un calendrier d'exemple pour la phase de
// groupes. Idempotent : peut être relancé sans dupliquer les données.
// Lancer avec : npm run seed
// -----------------------------------------------------------------------------
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, query, queryOne, migrate } = require("../db");

const GROUPS = {
  A: [
    { name: "Mexique", code: "MEX", flag: "🇲🇽", confederation: "CONCACAF", fifa_rank: 12 },
    { name: "Afrique du Sud", code: "RSA", flag: "🇿🇦", confederation: "CAF", fifa_rank: 60 },
    { name: "Corée du Sud", code: "KOR", flag: "🇰🇷", confederation: "AFC", fifa_rank: 22 },
    { name: "Tchéquie", code: "CZE", flag: "🇨🇿", confederation: "UEFA", fifa_rank: 35 },
  ],
  B: [
    { name: "Canada", code: "CAN", flag: "🇨🇦", confederation: "CONCACAF", fifa_rank: 27 },
    { name: "Bosnie-Herzégovine", code: "BIH", flag: "🇧🇦", confederation: "UEFA", fifa_rank: 47 },
    { name: "Qatar", code: "QAT", flag: "🇶🇦", confederation: "AFC", fifa_rank: 34 },
    { name: "Suisse", code: "SUI", flag: "🇨🇭", confederation: "UEFA", fifa_rank: 19 },
  ],
  C: [
    { name: "Brésil", code: "BRA", flag: "🇧🇷", confederation: "CONMEBOL", fifa_rank: 5 },
    { name: "Maroc", code: "MAR", flag: "🇲🇦", confederation: "CAF", fifa_rank: 13 },
    { name: "Haïti", code: "HAI", flag: "🇭🇹", confederation: "CONCACAF", fifa_rank: 85 },
    { name: "Écosse", code: "SCO", flag: "🏴", confederation: "UEFA", fifa_rank: 39 },
  ],
  D: [
    { name: "États-Unis", code: "USA", flag: "🇺🇸", confederation: "CONCACAF", fifa_rank: 16 },
    { name: "Paraguay", code: "PAR", flag: "🇵🇾", confederation: "CONMEBOL", fifa_rank: 54 },
    { name: "Australie", code: "AUS", flag: "🇦🇺", confederation: "AFC", fifa_rank: 26 },
    { name: "Turquie", code: "TUR", flag: "🇹🇷", confederation: "UEFA", fifa_rank: 24 },
  ],
  E: [
    { name: "Allemagne", code: "GER", flag: "🇩🇪", confederation: "UEFA", fifa_rank: 11 },
    { name: "Curaçao", code: "CUW", flag: "🇨🇼", confederation: "CONCACAF", fifa_rank: 82 },
    { name: "Côte d'Ivoire", code: "CIV", flag: "🇨🇮", confederation: "CAF", fifa_rank: 41 },
    { name: "Équateur", code: "ECU", flag: "🇪🇨", confederation: "CONMEBOL", fifa_rank: 25 },
  ],
  F: [
    { name: "Pays-Bas", code: "NED", flag: "🇳🇱", confederation: "UEFA", fifa_rank: 7 },
    { name: "Japon", code: "JPN", flag: "🇯🇵", confederation: "AFC", fifa_rank: 17 },
    { name: "Suède", code: "SWE", flag: "🇸🇪", confederation: "UEFA", fifa_rank: 30 },
    { name: "Tunisie", code: "TUN", flag: "🇹🇳", confederation: "CAF", fifa_rank: 44 },
  ],
  G: [
    { name: "Belgique", code: "BEL", flag: "🇧🇪", confederation: "UEFA", fifa_rank: 6 },
    { name: "Égypte", code: "EGY", flag: "🇪🇬", confederation: "CAF", fifa_rank: 33 },
    { name: "Iran", code: "IRN", flag: "🇮🇷", confederation: "AFC", fifa_rank: 20 },
    { name: "Nouvelle-Zélande", code: "NZL", flag: "🇳🇿", confederation: "OFC", fifa_rank: 90 },
  ],
  H: [
    { name: "Espagne", code: "ESP", flag: "🇪🇸", confederation: "UEFA", fifa_rank: 1 },
    { name: "Cap-Vert", code: "CPV", flag: "🇨🇻", confederation: "CAF", fifa_rank: 65 },
    { name: "Arabie Saoudite", code: "KSA", flag: "🇸🇦", confederation: "AFC", fifa_rank: 58 },
    { name: "Uruguay", code: "URU", flag: "🇺🇾", confederation: "CONMEBOL", fifa_rank: 14 },
  ],
  I: [
    { name: "France", code: "FRA", flag: "🇫🇷", confederation: "UEFA", fifa_rank: 2 },
    { name: "Sénégal", code: "SEN", flag: "🇸🇳", confederation: "CAF", fifa_rank: 18 },
    { name: "Irak", code: "IRQ", flag: "🇮🇶", confederation: "AFC", fifa_rank: 63 },
    { name: "Norvège", code: "NOR", flag: "🇳🇴", confederation: "UEFA", fifa_rank: 10 },
  ],
  J: [
    { name: "Argentine", code: "ARG", flag: "🇦🇷", confederation: "CONMEBOL", fifa_rank: 1 },
    { name: "Algérie", code: "ALG", flag: "🇩🇿", confederation: "CAF", fifa_rank: 37 },
    { name: "Autriche", code: "AUT", flag: "🇦🇹", confederation: "UEFA", fifa_rank: 23 },
    { name: "Jordanie", code: "JOR", flag: "🇯🇴", confederation: "AFC", fifa_rank: 66 },
  ],
  K: [
    { name: "Portugal", code: "POR", flag: "🇵🇹", confederation: "UEFA", fifa_rank: 4 },
    { name: "RD Congo", code: "COD", flag: "🇨🇩", confederation: "CAF", fifa_rank: 68 },
    { name: "Ouzbékistan", code: "UZB", flag: "🇺🇿", confederation: "AFC", fifa_rank: 57 },
    { name: "Colombie", code: "COL", flag: "🇨🇴", confederation: "CONMEBOL", fifa_rank: 15 },
  ],
  L: [
    { name: "Angleterre", code: "ENG", flag: "🏴", confederation: "UEFA", fifa_rank: 3 },
    { name: "Croatie", code: "CRO", flag: "🇭🇷", confederation: "UEFA", fifa_rank: 9 },
    { name: "Ghana", code: "GHA", flag: "🇬🇭", confederation: "CAF", fifa_rank: 62 },
    { name: "Panama", code: "PAN", flag: "🇵🇦", confederation: "CONCACAF", fifa_rank: 43 },
  ],
};

const STADIUMS = [
  ["Estadio Azteca", "Mexico City", 87000],
  ["BC Place", "Vancouver", 54500],
  ["SoFi Stadium", "Los Angeles", 70000],
  ["MetLife Stadium", "New York/New Jersey", 82500],
  ["AT&T Stadium", "Dallas", 80000],
  ["Mercedes-Benz Stadium", "Atlanta", 71000],
  ["Lincoln Financial Field", "Philadelphia", 69000],
  ["Gillette Stadium", "Boston", 65000],
  ["Hard Rock Stadium", "Miami", 65000],
  ["NRG Stadium", "Houston", 72000],
  ["Levi's Stadium", "San Francisco Bay Area", 68500],
  ["Arrowhead Stadium", "Kansas City", 76000],
  ["Lumen Field", "Seattle", 69000],
  ["BMO Field", "Toronto", 30000],
  ["Estadio BBVA", "Monterrey", 53500],
  ["Estadio Akron", "Guadalajara", 46000],
];

const REFEREE_NATIONS = [
  "France", "Brésil", "Argentine", "Allemagne", "Angleterre", "Espagne", "Italie", "Portugal",
  "Mexique", "États-Unis", "Sénégal", "Maroc", "Japon", "Corée du Sud", "Australie", "Qatar",
  "Pays-Bas", "Belgique", "Uruguay", "Colombie",
];

const FIRST_NAMES = ["Léo", "Nassim", "Victor", "Amadou", "Luca", "Tomás", "Kian", "Rafael", "Noah", "Elias", "Mateo", "Ismaël"];
const LAST_NAMES = ["Moreau", "Bakker", "Silva", "Nakamura", "Cissé", "García", "Novak", "Andersson", "Kovač", "Pereira", "Haddad", "Lindqvist"];
const POSITIONS = ["GARDIEN", "DEFENSEUR", "DEFENSEUR", "MILIEU", "MILIEU", "ATTAQUANT"];

function generatedName(rng) {
  return `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]}`;
}

// Générateur pseudo-aléatoire déterministe (seed reproductible entre relances)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function run() {
  await migrate();
  const rng = mulberry32(20260611);

  // --- Groupes & équipes --------------------------------------------------
  for (const [letter, teams] of Object.entries(GROUPS)) {
    await query("INSERT INTO groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [`Groupe ${letter}`]);
    const group = await queryOne("SELECT id FROM groups WHERE name = $1", [`Groupe ${letter}`]);
    for (const t of teams) {
      await query(
        `INSERT INTO teams (name, code, flag, group_id, confederation, fifa_rank)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (name) DO NOTHING`,
        [t.name, t.code, t.flag, group.id, t.confederation, t.fifa_rank]
      );
    }
  }

  // --- Stades (16 sites hôtes réels) --------------------------------------
  for (const [name, city, capacity] of STADIUMS) {
    await query("INSERT INTO stadiums (name, city, capacity) VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING", [
      name,
      city,
      capacity,
    ]);
  }

  // --- Arbitres (démonstration — à compléter par l'organisateur) ---------
  const refereeCount = await queryOne("SELECT COUNT(*)::int AS n FROM referees");
  if (refereeCount.n === 0) {
    for (const nat of REFEREE_NATIONS) {
      await query("INSERT INTO referees (name, nationality) VALUES ($1,$2)", [`Arbitre ${generatedName(rng)}`, nat]);
    }
    console.log(`✔ ${REFEREE_NATIONS.length} arbitres créés`);
  }

  // --- Compte administrateur par défaut (à changer en production) --------
  const email = process.env.SEED_ADMIN_EMAIL || "admin@fifa26.control";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMoi123!";
  const existingAdmin = await queryOne("SELECT id FROM users WHERE email = $1", [email]);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(password, 10);
    await query("INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)", [
      "Administrateur",
      email,
      hash,
      "admin",
    ]);
    console.log(`✔ Compte admin créé → ${email} / ${password}`);
  }

  // --- Effectifs : joueurs (générés) + 1 entraîneur par équipe -----------
  const playerCount = await queryOne("SELECT COUNT(*)::int AS n FROM players");
  if (playerCount.n === 0) {
    for (const t of Object.values(GROUPS).flat()) {
      const team = await queryOne("SELECT id FROM teams WHERE name = $1", [t.name]);
      await query("INSERT INTO coaches (team_id, name, nationality, role) VALUES ($1,$2,$3,'Sélectionneur')", [
        team.id,
        `Coach ${generatedName(rng)}`,
        t.name,
      ]);
      for (let i = 0; i < POSITIONS.length; i++) {
        await query(
          "INSERT INTO players (team_id, name, number, position, nationality) VALUES ($1,$2,$3,$4,$5)",
          [team.id, generatedName(rng), i + 1, POSITIONS[i], t.name]
        );
      }
    }
    console.log("✔ Effectifs générés : 6 joueurs + 1 entraîneur par équipe (48 équipes)");
  }

  // --- Calendrier de la phase de groupes ----------------------------------
  const matchCount = await queryOne("SELECT COUNT(*)::int AS n FROM matches");
  if (matchCount.n === 0) {
    let stadiumIdx = 0;
    let refereeIdx = 0;
    let day = new Date("2026-06-11T17:00:00Z");
    const referees = await query("SELECT id FROM referees");

    for (const [letter, teams] of Object.entries(GROUPS)) {
      const group = await queryOne("SELECT id FROM groups WHERE name = $1", [`Groupe ${letter}`]);
      const ids = [];
      for (const t of teams) {
        const team = await queryOne("SELECT id FROM teams WHERE name = $1", [t.name]);
        ids.push(team.id);
      }

      const fixtures = [
        [0, 1],
        [2, 3],
        [0, 2],
        [1, 3],
        [0, 3],
        [1, 2],
      ];

      for (let idx = 0; idx < fixtures.length; idx++) {
        const [hi, ai] = fixtures[idx];
        const [stadiumName, city] = STADIUMS[stadiumIdx % STADIUMS.length];
        const stadiumRow = await queryOne("SELECT id FROM stadiums WHERE name = $1", [stadiumName]);
        stadiumIdx++;
        const refereeId = referees.length ? referees[refereeIdx % referees.length].id : null;
        refereeIdx++;
        const kickoff = new Date(day.getTime() + idx * 26 * 60 * 60 * 1000);
        const isPast = idx === 0; // simule un premier match déjà joué pour démo du classement auto
        const homeScore = isPast ? Math.floor(rng() * 4) : null;
        const awayScore = isPast ? Math.floor(rng() * 4) : null;

        const inserted = await queryOne(
          `INSERT INTO matches (group_id, home_team_id, away_team_id, stadium, city, stadium_id, referee_id, kickoff_at, round, status, home_score, away_score)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
          [
            group.id,
            ids[hi],
            ids[ai],
            stadiumName,
            city,
            stadiumRow.id,
            refereeId,
            kickoff.toISOString(),
            "Phase de groupes",
            isPast ? "TERMINE" : "PROGRAMME",
            homeScore,
            awayScore,
          ]
        );

        if (isPast) {
          const matchId = inserted.id;
          const homeTeamId = ids[hi];
          const awayTeamId = ids[ai];
          const homePlayers = await query("SELECT id FROM players WHERE team_id = $1 AND position != 'GARDIEN'", [homeTeamId]);
          const awayPlayers = await query("SELECT id FROM players WHERE team_id = $1 AND position != 'GARDIEN'", [awayTeamId]);

          for (let i = 0; i < homeScore; i++) {
            const scorer = homePlayers[Math.floor(rng() * homePlayers.length)];
            await query("INSERT INTO match_events (match_id, team_id, player_id, type, minute) VALUES ($1,$2,$3,'BUT',$4)", [
              matchId,
              homeTeamId,
              scorer?.id ?? null,
              Math.floor(rng() * 90) + 1,
            ]);
          }
          for (let i = 0; i < awayScore; i++) {
            const scorer = awayPlayers[Math.floor(rng() * awayPlayers.length)];
            await query("INSERT INTO match_events (match_id, team_id, player_id, type, minute) VALUES ($1,$2,$3,'BUT',$4)", [
              matchId,
              awayTeamId,
              scorer?.id ?? null,
              Math.floor(rng() * 90) + 1,
            ]);
          }
          // Un carton jaune de démonstration
          const cardedTeam = rng() > 0.5 ? homeTeamId : awayTeamId;
          const cardedPool = cardedTeam === homeTeamId ? homePlayers : awayPlayers;
          const carded = cardedPool[Math.floor(rng() * cardedPool.length)];
          if (carded) {
            await query(
              "INSERT INTO match_events (match_id, team_id, player_id, type, minute) VALUES ($1,$2,$3,'CARTON_JAUNE',$4)",
              [matchId, cardedTeam, carded.id, Math.floor(rng() * 90) + 1]
            );
          }
        }
      }
      day = new Date(day.getTime() + 20 * 60 * 60 * 1000);
    }
    console.log("✔ Calendrier de la phase de groupes généré (72 matchs) avec stades et arbitres assignés");
  }

  console.log("✔ Seed terminé : 12 groupes, 48 équipes, stades, arbitres, effectifs et événements de démo.");
}

if (require.main === module) {
  run()
    .then(() => pool.end())
    .catch((err) => {
      console.error("❌ Échec du seed :", err.message);
      process.exit(1);
    });
}

module.exports = run;
