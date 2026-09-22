// lib/api.ts
// -----------------------------------------------------------------------------
// Client léger pour consommer l'API REST Node.js/Express (server/).
// L'URL est configurable via NEXT_PUBLIC_API_URL (voir .env.example).
// -----------------------------------------------------------------------------

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export type Team = {
  id: number
  name: string
  code: string
  flag: string | null
  confederation: string | null
  fifa_rank: number | null
  group_name?: string
}

export type Group = { id: number; name: string; teams: Team[] }

export type Match = {
  id: number
  group_id: number | null
  group_name: string | null
  home_team_id: number
  home_team: string
  home_code: string
  home_flag: string | null
  away_team_id: number
  away_team: string
  away_code: string
  away_flag: string | null
  stadium: string | null
  city: string | null
  stadium_id: number | null
  stadium_name?: string | null
  stadium_capacity?: number | null
  referee_id: number | null
  referee_name?: string | null
  kickoff_at: string
  round: string
  status: "PROGRAMME" | "EN_COURS" | "TERMINE" | "REPORTE"
  home_score: number | null
  away_score: number | null
}

export type StandingRow = {
  position: number
  team_id: number
  name: string
  code: string
  flag: string | null
  joues: number
  gagnes: number
  nuls: number
  perdus: number
  buts_pour: number
  buts_contre: number
  diff: number
  points: number
  forme: string[]
}

export type GroupStandings = { group_id: number; group_name: string; standings: StandingRow[] }

export type PlayerStat = {
  player_id: number
  player_name: string
  position: string
  team_id: number
  team_name: string
  team_code: string
  team_flag: string | null
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
}

export type Stadium = { id: number; name: string; city: string; capacity: number | null; image: string | null }
export type Referee = { id: number; name: string; nationality: string | null; matches_officiated: number }
export type Player = {
  id: number
  team_id: number
  name: string
  number: number | null
  position: "GARDIEN" | "DEFENSEUR" | "MILIEU" | "ATTAQUANT"
  birth_date: string | null
  nationality: string | null
  team_name?: string
  team_code?: string
  team_flag?: string | null
}
export type Coach = { id: number; team_id: number; name: string; nationality: string | null; role: string; team_name?: string }
export type MatchEvent = {
  id: number
  match_id: number
  team_id: number
  player_id: number | null
  player_name: string | null
  team_name: string
  team_code: string
  team_flag: string | null
  type: "BUT" | "CARTON_JAUNE" | "CARTON_ROUGE" | "PASSE_DECISIVE"
  minute: number | null
}
export type Notification = { id: number; type: string; title: string; message: string; match_id: number | null; created_at: string }

class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data?.error || `Erreur API (${res.status})`)
  return data as T
}

export const api = {
  groups: () => request<{ groups: Group[] }>("/api/groups"),
  matches: (params?: { group?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ matches: Match[] }>(`/api/matches${qs ? `?${qs}` : ""}`)
  },
  standings: () => request<{ standings: GroupStandings[] }>("/api/standings"),
  standingsForGroup: (group: string) => request<GroupStandings>(`/api/standings/${group}`),
  topScorers: (limit = 8) => request<{ top_scorers: PlayerStat[] }>(`/api/stats/top-scorers?limit=${limit}`),
  discipline: (limit = 8) => request<{ discipline: PlayerStat[] }>(`/api/stats/discipline?limit=${limit}`),
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; name: string; email: string; role: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  me: (token: string) => request<{ user: any }>("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
  updateScore: (token: string, matchId: number, home_score: number, away_score: number, status = "TERMINE") =>
    request<{ match: Match; standings: StandingRow[] }>(`/api/matches/${matchId}/score`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ home_score, away_score, status }),
    }),

  // --- Stades ---
  stadiums: () => request<{ stadiums: Stadium[] }>("/api/stadiums"),
  createStadium: (token: string, data: Partial<Stadium>) =>
    request<{ stadium: Stadium }>("/api/stadiums", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // --- Arbitres ---
  referees: () => request<{ referees: Referee[] }>("/api/referees"),
  createReferee: (token: string, data: Partial<Referee>) =>
    request<{ referee: Referee }>("/api/referees", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // --- Joueurs ---
  players: (team_id?: number) => request<{ players: Player[] }>(`/api/players${team_id ? `?team_id=${team_id}` : ""}`),
  createPlayer: (token: string, data: Partial<Player>) =>
    request<{ player: Player }>("/api/players", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // --- Entraîneurs ---
  coaches: (team_id?: number) => request<{ coaches: Coach[] }>(`/api/coaches${team_id ? `?team_id=${team_id}` : ""}`),
  createCoach: (token: string, data: Partial<Coach>) =>
    request<{ coach: Coach }>("/api/coaches", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // --- Événements de match (buts, cartons) ---
  events: (match_id: number) => request<{ events: MatchEvent[] }>(`/api/events?match_id=${match_id}`),
  createEvent: (
    token: string,
    data: { match_id: number; team_id: number; player_id?: number; type: MatchEvent["type"]; minute?: number }
  ) =>
    request<{ event: MatchEvent }>("/api/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // --- Notifications (fil d'actualité, consommé par polling) ---
  notifications: (since?: string) =>
    request<{ notifications: Notification[]; server_time: string }>(
      `/api/notifications${since ? `?since=${encodeURIComponent(since)}` : "?limit=15"}`
    ),
}

export { ApiError }
