"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, LogOut, RefreshCcw } from "lucide-react"
import {
  api,
  type Match,
  type Group,
  type Player,
  type Coach,
  type Referee,
  type Stadium,
  type MatchEvent,
} from "@/lib/api"

const TOKEN_KEY = "fifa26_admin_token"
const TABS = ["Résultats", "Événements", "Effectifs", "Stades & arbitres"] as const
type Tab = (typeof TABS)[number]

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>("Résultats")
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY)
    if (stored) {
      api
        .me(stored)
        .then((r) => {
          setToken(stored)
          setUser(r.user)
        })
        .catch(() => window.localStorage.removeItem(TOKEN_KEY))
    }
  }, [])

  async function login(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.login(email.trim(), password)
      window.localStorage.setItem(TOKEN_KEY, res.token)
      setToken(res.token)
      setUser(res.user)
    } catch (err: any) {
      setError(err?.message || "Connexion impossible.")
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-[#080808] px-5 py-8 text-[#f0efea] sm:px-10">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-[#aaa] hover:text-white">
          ← Retour à FIFA26
        </Link>
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <section className="w-full border border-white/15 bg-white/[.03] p-6 sm:p-10">
            <p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#ef3f30]">FIFA26 / ORGANISATEUR</p>
            <h1 className="mt-5 font-serif text-5xl tracking-[-.05em]">Admin</h1>
            <p className="mt-3 text-sm text-[#aaa]">
              Gestion des équipes, matchs, résultats, buts/cartons, arbitres et stades.
            </p>
            <form onSubmit={login} className="mt-8 space-y-4">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse email"
                className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#ef3f30]"
              />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#ef3f30]"
              />
              {error && <p role="alert" aria-live="polite" className="text-sm text-[#ef3f30]">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ef3f30] px-4 py-4 font-mono text-xs uppercase tracking-[.2em] text-white transition hover:bg-white hover:text-black disabled:opacity-50"
              >
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-[#666]">
              Identifiants de démo (après <code className="text-[#888]">npm run seed</code>) :<br />
              admin@fifa26.control / ChangeMoi123!
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-8 text-[#f0efea] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-[#aaa] hover:text-white">
            ← Retour à FIFA26
          </Link>
          <button onClick={logout} className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#aaa] hover:text-white">
            <LogOut size={13} /> Déconnexion
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#ef3f30]">FIFA26 / ORGANISATEUR</p>
            <h1 className="mt-3 font-serif text-4xl tracking-[-.05em]">Bonjour, {user?.name}</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/40">Rôle : {user?.role}</p>
          </div>
        </div>

        {feedback && (
          <p className="mt-6 border border-white/15 bg-white/[.03] px-4 py-3 font-mono text-xs uppercase tracking-widest text-white/70">
            {feedback}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-1 border-b border-white/10">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-active={tab === t}
              className="border-b-2 border-transparent px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-white data-[active=true]:border-[#ef3f30] data-[active=true]:text-white"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "Résultats" && <ResultsTab token={token} setFeedback={setFeedback} />}
          {tab === "Événements" && <EventsTab token={token} setFeedback={setFeedback} />}
          {tab === "Effectifs" && <RosterTab token={token} setFeedback={setFeedback} />}
          {tab === "Stades & arbitres" && <InfraTab token={token} setFeedback={setFeedback} />}
        </div>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Onglet Résultats — saisie des scores (déclenche le recalcul automatique du
// classement côté API).
// ---------------------------------------------------------------------------
function ResultsTab({ token, setFeedback }: { token: string; setFeedback: (s: string) => void }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  function load() {
    api.matches().then((r) => setMatches(r.matches)).catch(() => setFeedback("Impossible de charger les matchs."))
  }
  useEffect(load, [])

  async function saveScore(matchId: number) {
    const draft = scores[matchId]
    if (!draft || draft.home === "" || draft.away === "") return
    setSavingId(matchId)
    try {
      await api.updateScore(token, matchId, Number(draft.home), Number(draft.away))
      setFeedback("Score enregistré — classement recalculé automatiquement.")
      load()
    } catch (err: any) {
      setFeedback(err?.message || "Échec de l'enregistrement du score.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <button onClick={load} className="mb-4 flex items-center gap-2 border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-white">
        <RefreshCcw size={12} /> Actualiser
      </button>
      <div className="divide-y divide-white/10 border-y border-white/10">
        {matches.map((m) => {
          const draft = scores[m.id] ?? { home: m.home_score?.toString() ?? "", away: m.away_score?.toString() ?? "" }
          return (
            <div key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 font-mono text-xs">
              <div>
                <p className="text-white/40">
                  {m.group_name} · {new Date(m.kickoff_at).toLocaleDateString("fr-FR")} · {m.stadium}
                </p>
                <p className="mt-1 text-base normal-case tracking-tight text-white">
                  {m.home_flag} {m.home_team} <span className="text-white/30">vs</span> {m.away_team} {m.away_flag}
                </p>
                <p className="mt-1 uppercase tracking-widest text-white/30">{m.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={draft.home}
                  onChange={(e) => setScores((s) => ({ ...s, [m.id]: { ...draft, home: e.target.value } }))}
                  className="w-14 border border-white/15 bg-transparent px-2 py-2 text-center outline-none focus:border-[#ef3f30]"
                  aria-label={`Score ${m.home_team}`}
                />
                <span>–</span>
                <input
                  type="number"
                  min={0}
                  value={draft.away}
                  onChange={(e) => setScores((s) => ({ ...s, [m.id]: { ...draft, away: e.target.value } }))}
                  className="w-14 border border-white/15 bg-transparent px-2 py-2 text-center outline-none focus:border-[#ef3f30]"
                  aria-label={`Score ${m.away_team}`}
                />
                <button
                  onClick={() => saveScore(m.id)}
                  disabled={savingId === m.id}
                  className="flex items-center gap-1 bg-[#f0efea] px-3 py-2 text-black hover:bg-[#ef3f30] hover:text-white disabled:opacity-50"
                >
                  {savingId === m.id ? "…" : "Valider"} <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          )
        })}
        {matches.length === 0 && <p className="py-10 uppercase text-white/40">Aucun match.</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onglet Événements — buts, cartons jaunes/rouges, passes décisives, liés à
// un match et un joueur précis. Alimente automatiquement les statistiques et
// le fil de notifications.
// ---------------------------------------------------------------------------
const EVENT_TYPES: { value: MatchEvent["type"]; label: string }[] = [
  { value: "BUT", label: "⚽ But" },
  { value: "PASSE_DECISIVE", label: "🅰️ Passe décisive" },
  { value: "CARTON_JAUNE", label: "🟨 Carton jaune" },
  { value: "CARTON_ROUGE", label: "🟥 Carton rouge" },
]

function EventsTab({ token, setFeedback }: { token: string; setFeedback: (s: string) => void }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [matchId, setMatchId] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [teamId, setTeamId] = useState<number | null>(null)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [type, setType] = useState<MatchEvent["type"]>("BUT")
  const [minute, setMinute] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.matches().then((r) => setMatches(r.matches))
  }, [])

  const selectedMatch = matches.find((m) => m.id === matchId) ?? null

  useEffect(() => {
    if (!matchId) return
    api.events(matchId).then((r) => setEvents(r.events))
  }, [matchId])

  useEffect(() => {
    if (!teamId) {
      setPlayers([])
      return
    }
    api.players(teamId).then((r) => setPlayers(r.players))
  }, [teamId])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!matchId || !teamId) return
    setSaving(true)
    try {
      await api.createEvent(token, {
        match_id: matchId,
        team_id: teamId,
        player_id: playerId ?? undefined,
        type,
        minute: minute ? Number(minute) : undefined,
      })
      setFeedback("Événement enregistré — statistiques et notifications mises à jour.")
      api.events(matchId).then((r) => setEvents(r.events))
      setMinute("")
    } catch (err: any) {
      setFeedback(err?.message || "Échec de l'enregistrement de l'événement.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-white/50">Match</label>
        <select
          value={matchId ?? ""}
          onChange={(e) => {
            setMatchId(Number(e.target.value) || null)
            setTeamId(null)
            setPlayerId(null)
          }}
          className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 font-mono text-xs uppercase outline-none focus:border-[#ef3f30]"
        >
          <option value="">— Sélectionner —</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.home_team} vs {m.away_team} · {new Date(m.kickoff_at).toLocaleDateString("fr-FR")}
            </option>
          ))}
        </select>

        {selectedMatch && (
          <form onSubmit={submit} className="mt-6 space-y-4 border border-white/15 bg-white/[.03] p-5">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-white/50">Équipe</label>
              <select
                required
                value={teamId ?? ""}
                onChange={(e) => {
                  setTeamId(Number(e.target.value))
                  setPlayerId(null)
                }}
                className="mt-2 w-full border border-white/15 bg-transparent px-3 py-2 font-mono text-xs uppercase outline-none focus:border-[#ef3f30]"
              >
                <option value="">— Sélectionner —</option>
                <option value={selectedMatch.home_team_id}>{selectedMatch.home_team}</option>
                <option value={selectedMatch.away_team_id}>{selectedMatch.away_team}</option>
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-white/50">Joueur</label>
              <select
                value={playerId ?? ""}
                onChange={(e) => setPlayerId(Number(e.target.value) || null)}
                className="mt-2 w-full border border-white/15 bg-transparent px-3 py-2 font-mono text-xs uppercase outline-none focus:border-[#ef3f30]"
              >
                <option value="">— Non spécifié —</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/50">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MatchEvent["type"])}
                  className="mt-2 w-full border border-white/15 bg-transparent px-3 py-2 font-mono text-xs uppercase outline-none focus:border-[#ef3f30]"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/50">Minute</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="mt-2 w-full border border-white/15 bg-transparent px-3 py-2 text-center font-mono text-xs outline-none focus:border-[#ef3f30]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !teamId}
              className="w-full bg-[#ef3f30] px-4 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Ajouter l'événement"}
            </button>
          </form>
        )}
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">Événements du match</p>
        <div className="mt-3 divide-y divide-white/10 border-y border-white/10">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between py-3 font-mono text-xs">
              <span>
                {EVENT_TYPES.find((t) => t.value === ev.type)?.label ?? ev.type} — {ev.team_flag} {ev.player_name ?? ev.team_name}
              </span>
              <span className="text-white/40">{ev.minute ? `${ev.minute}'` : "—"}</span>
            </div>
          ))}
          {events.length === 0 && <p className="py-8 uppercase text-white/40">Aucun événement pour ce match.</p>}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onglet Effectifs — ajout rapide de joueurs / entraîneurs par équipe.
// ---------------------------------------------------------------------------
function RosterTab({ token, setFeedback }: { token: string; setFeedback: (s: string) => void }) {
  const [groups, setGroups] = useState<Group[]>([])
  const [teamId, setTeamId] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [coach, setCoach] = useState<Coach | null>(null)

  const [playerForm, setPlayerForm] = useState({ name: "", number: "", position: "MILIEU", nationality: "" })
  const [coachForm, setCoachForm] = useState({ name: "", nationality: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.groups().then((r) => setGroups(r.groups))
  }, [])

  const allTeams = useMemo(() => groups.flatMap((g) => g.teams), [groups])

  function loadRoster(id: number) {
    api.players(id).then((r) => setPlayers(r.players))
    api.coaches(id).then((r) => setCoach(r.coaches[0] ?? null))
  }

  useEffect(() => {
    if (teamId) loadRoster(teamId)
  }, [teamId])

  async function addPlayer(e: FormEvent) {
    e.preventDefault()
    if (!teamId || !playerForm.name) return
    setSaving(true)
    try {
      await api.createPlayer(token, {
        team_id: teamId,
        name: playerForm.name,
        number: playerForm.number ? Number(playerForm.number) : undefined,
        position: playerForm.position as Player["position"],
        nationality: playerForm.nationality || undefined,
      })
      setFeedback("Joueur ajouté.")
      setPlayerForm({ name: "", number: "", position: "MILIEU", nationality: "" })
      loadRoster(teamId)
    } catch (err: any) {
      setFeedback(err?.message || "Échec de l'ajout du joueur.")
    } finally {
      setSaving(false)
    }
  }

  async function addCoach(e: FormEvent) {
    e.preventDefault()
    if (!teamId || !coachForm.name) return
    setSaving(true)
    try {
      await api.createCoach(token, { team_id: teamId, name: coachForm.name, nationality: coachForm.nationality || undefined })
      setFeedback("Entraîneur enregistré.")
      loadRoster(teamId)
    } catch (err: any) {
      setFeedback(err?.message || "Échec de l'ajout de l'entraîneur.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-widest text-white/50">Équipe</label>
      <select
        value={teamId ?? ""}
        onChange={(e) => setTeamId(Number(e.target.value) || null)}
        className="mt-2 w-full max-w-sm border border-white/15 bg-transparent px-3 py-3 font-mono text-xs uppercase outline-none focus:border-[#ef3f30]"
      >
        <option value="">— Sélectionner —</option>
        {allTeams.map((t) => (
          <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
        ))}
      </select>

      {teamId && (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/50">Ajouter un joueur</p>
            <form onSubmit={addPlayer} className="space-y-3 border border-white/15 bg-white/[.03] p-5">
              <input required placeholder="Nom" value={playerForm.name} onChange={(e) => setPlayerForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Numéro" value={playerForm.number} onChange={(e) => setPlayerForm((f) => ({ ...f, number: e.target.value }))} className="border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
                <select value={playerForm.position} onChange={(e) => setPlayerForm((f) => ({ ...f, position: e.target.value }))} className="border border-white/15 bg-transparent px-3 py-2 text-xs uppercase outline-none focus:border-[#ef3f30]">
                  <option value="GARDIEN">Gardien</option>
                  <option value="DEFENSEUR">Défenseur</option>
                  <option value="MILIEU">Milieu</option>
                  <option value="ATTAQUANT">Attaquant</option>
                </select>
              </div>
              <input placeholder="Nationalité (optionnel)" value={playerForm.nationality} onChange={(e) => setPlayerForm((f) => ({ ...f, nationality: e.target.value }))} className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
              <button type="submit" disabled={saving} className="w-full bg-[#ef3f30] px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black disabled:opacity-50">
                Ajouter
              </button>
            </form>

            <p className="mt-6 mb-2 font-mono text-[9px] uppercase tracking-widest text-white/40">Effectif actuel ({players.length})</p>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 font-mono text-xs">
                  <span>#{p.number} {p.name}</span>
                  <span className="text-white/40">{p.position}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/50">Entraîneur</p>
            {coach ? (
              <p className="border border-white/15 bg-white/[.03] p-5 text-sm">
                {coach.name} <span className="text-white/40">({coach.nationality ?? "—"})</span>
              </p>
            ) : (
              <form onSubmit={addCoach} className="space-y-3 border border-white/15 bg-white/[.03] p-5">
                <input required placeholder="Nom" value={coachForm.name} onChange={(e) => setCoachForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
                <input placeholder="Nationalité" value={coachForm.nationality} onChange={(e) => setCoachForm((f) => ({ ...f, nationality: e.target.value }))} className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
                <button type="submit" disabled={saving} className="w-full bg-[#ef3f30] px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black disabled:opacity-50">
                  Enregistrer
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onglet Stades & arbitres — gestion simple (ajout + liste).
// ---------------------------------------------------------------------------
function InfraTab({ token, setFeedback }: { token: string; setFeedback: (s: string) => void }) {
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [referees, setReferees] = useState<Referee[]>([])
  const [stadiumForm, setStadiumForm] = useState({ name: "", city: "", capacity: "" })
  const [refereeForm, setRefereeForm] = useState({ name: "", nationality: "" })
  const [saving, setSaving] = useState(false)

  function load() {
    api.stadiums().then((r) => setStadiums(r.stadiums))
    api.referees().then((r) => setReferees(r.referees))
  }
  useEffect(load, [])

  async function addStadium(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createStadium(token, {
        name: stadiumForm.name,
        city: stadiumForm.city,
        capacity: stadiumForm.capacity ? Number(stadiumForm.capacity) : undefined,
      })
      setFeedback("Stade ajouté.")
      setStadiumForm({ name: "", city: "", capacity: "" })
      load()
    } catch (err: any) {
      setFeedback(err?.message || "Échec de l'ajout du stade.")
    } finally {
      setSaving(false)
    }
  }

  async function addReferee(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createReferee(token, { name: refereeForm.name, nationality: refereeForm.nationality || undefined })
      setFeedback("Arbitre ajouté.")
      setRefereeForm({ name: "", nationality: "" })
      load()
    } catch (err: any) {
      setFeedback(err?.message || "Échec de l'ajout de l'arbitre.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/50">Stades ({stadiums.length})</p>
        <form onSubmit={addStadium} className="space-y-3 border border-white/15 bg-white/[.03] p-5">
          <input required placeholder="Nom du stade" value={stadiumForm.name} onChange={(e) => setStadiumForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
          <input required placeholder="Ville" value={stadiumForm.city} onChange={(e) => setStadiumForm((f) => ({ ...f, city: e.target.value }))} className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
          <input type="number" placeholder="Capacité" value={stadiumForm.capacity} onChange={(e) => setStadiumForm((f) => ({ ...f, capacity: e.target.value }))} className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
          <button type="submit" disabled={saving} className="w-full bg-[#ef3f30] px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black disabled:opacity-50">
            Ajouter le stade
          </button>
        </form>
        <div className="mt-4 max-h-64 divide-y divide-white/10 overflow-y-auto border-y border-white/10">
          {stadiums.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 font-mono text-xs">
              <span>{s.name}</span>
              <span className="text-white/40">{s.city}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/50">Arbitres ({referees.length})</p>
        <form onSubmit={addReferee} className="space-y-3 border border-white/15 bg-white/[.03] p-5">
          <input required placeholder="Nom" value={refereeForm.name} onChange={(e) => setRefereeForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
          <input placeholder="Nationalité" value={refereeForm.nationality} onChange={(e) => setRefereeForm((f) => ({ ...f, nationality: e.target.value }))} className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ef3f30]" />
          <button type="submit" disabled={saving} className="w-full bg-[#ef3f30] px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black disabled:opacity-50">
            Ajouter l'arbitre
          </button>
        </form>
        <div className="mt-4 max-h-64 divide-y divide-white/10 overflow-y-auto border-y border-white/10">
          {referees.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 font-mono text-xs">
              <span>{r.name}</span>
              <span className="text-white/40">{r.nationality ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
