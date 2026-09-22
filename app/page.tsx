"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight, ChevronDown, CircleDot, Menu, Search, Trophy, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Cursor } from "@/components/cursor"
import { ScrollProgress, LiveClock, MagneticButton, Countdown } from "@/components/chrome"
import { Reveal, RevealWords, RevealLine } from "@/components/reveal"
import { Marquee } from "@/components/marquee"
import { NotificationBell } from "@/components/notifications"
import { MatchCalendar } from "@/components/calendar"
import { api, type Group, type Match, type GroupStandings, type PlayerStat, type Stadium } from "@/lib/api"

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
const STATUS_LABELS: Record<string, string> = {
  Tous: "Tous les statuts",
  PROGRAMME: "À venir",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  REPORTE: "Reporté",
}

export default function Home() {
  const [menu, setMenu] = useState(false)
  const [filter, setFilter] = useState("Tous")
  const [statusFilter, setStatusFilter] = useState("Tous")
  const [groupFilter, setGroupFilter] = useState("Tous")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"liste" | "calendrier">("liste")
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [activeGroup, setActiveGroup] = useState("A")

  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<GroupStandings | null>(null)
  const [scorers, setScorers] = useState<PlayerStat[]>([])
  const [discipline, setDiscipline] = useState<PlayerStat[]>([])
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [apiDown, setApiDown] = useState(false)
  const [loading, setLoading] = useState(true)

  // Ferme le menu mobile à l'échap (défaut d'accessibilité corrigé)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Active le curseur personnalisé (classe posée sur <html>, jamais sur tactile)
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      document.documentElement.classList.add("has-custom-cursor")
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [g, m, s, d, st] = await Promise.all([
          api.groups(),
          api.matches(),
          api.topScorers(8),
          api.discipline(6),
          api.stadiums(),
        ])
        if (cancelled) return
        setGroups(g.groups)
        setMatches(m.matches)
        setScorers(s.top_scorers)
        setDiscipline(d.discipline)
        setStadiums(st.stadiums)
        setApiDown(false)
      } catch {
        if (!cancelled) setApiDown(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    api
      .standingsForGroup(activeGroup)
      .then((r) => !cancelled && setStandings(r))
      .catch(() => !cancelled && setStandings(null))
    return () => {
      cancelled = true
    }
  }, [activeGroup])

  const teamNames = useMemo(() => groups.flatMap((g) => g.teams.map((t) => t.name)), [groups])

  const filtered = matches
    .filter((m) => filter === "Tous" || m.home_team === filter || m.away_team === filter)
    .filter((m) => statusFilter === "Tous" || m.status === statusFilter)
    .filter((m) => groupFilter === "Tous" || m.group_name === `Groupe ${groupFilter}`)
    .filter((m) => {
      if (!selectedDay) return true
      const d = new Date(m.kickoff_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      return key === selectedDay
    })
    .filter((m) => `${m.home_team} ${m.away_team} ${m.stadium ?? ""}`.toLowerCase().includes(search.toLowerCase()))

  const nextMatch = useMemo(() => {
    const upcoming = matches
      .filter((m) => m.status === "PROGRAMME" && new Date(m.kickoff_at).getTime() > Date.now())
      .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())
    return upcoming[0] ?? null
  }, [matches])

  return (
    <main className="min-h-screen bg-[#050505] text-[#f1f0eb] selection:bg-[#ef3f30] selection:text-white">
      <Cursor />
      <ScrollProgress />
      <div className="grain-overlay" />

      <header className="fixed top-0 z-40 flex w-full items-center justify-between px-5 py-5 mix-blend-difference md:px-10">
        <a href="#top" data-cursor data-cursor-label="Haut" className="font-mono text-sm font-bold tracking-[-0.08em]">
          FIFA<span className="text-[#ef3f30]">26</span>
          <span className="ml-1 text-xs font-normal tracking-normal text-white/60">/ CONTROL</span>
        </a>
        <nav className="hidden gap-8 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 md:flex">
          <a href="#overview" className="nav-link hover:text-white">Overview</a>
          <a href="#matches" className="nav-link hover:text-white">Calendrier</a>
          <a href="#ranking" className="nav-link hover:text-white">Classement</a>
          <a href="#stats" className="nav-link hover:text-white">Stats</a>
          <Link href="/equipes" className="nav-link hover:text-white">Équipes</Link>
          <a href="#infra" className="nav-link hover:text-white">Stades</a>
          <span className="hidden items-center gap-4 border-l border-white/20 pl-8 lg:flex">
            <LiveClock zone="America/Mexico_City" label="MEX" />
            <LiveClock zone="America/Toronto" label="CAN" />
            <LiveClock zone="America/New_York" label="USA" />
          </span>
        </nav>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button aria-label={menu ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menu} onClick={() => setMenu(!menu)} className="rounded-full border border-white/20 p-2.5 md:hidden">
            {menu ? <X size={15} /> : <Menu size={15} />}
          </button>
          <Link href="/connexion" data-cursor data-cursor-label="Go" className="hidden bg-[#f0efea] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-black transition-colors hover:bg-[#ef3f30] hover:text-white md:block">
            Connexion <ArrowUpRight className="ml-2 inline" size={13} />
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-30 bg-[#ef3f30] p-8 pt-28 md:hidden"
          >
            <div className="flex flex-col gap-5 font-mono text-4xl uppercase tracking-tight">
              <a onClick={() => setMenu(false)} href="#overview">Overview</a>
              <a onClick={() => setMenu(false)} href="#matches">Calendrier</a>
              <a onClick={() => setMenu(false)} href="#ranking">Classement</a>
              <a onClick={() => setMenu(false)} href="#stats">Stats</a>
              <Link onClick={() => setMenu(false)} href="/equipes">Équipes</Link>
              <a onClick={() => setMenu(false)} href="#infra">Stades</a>
              <Link onClick={() => setMenu(false)} href="/connexion">Connexion <ArrowUpRight className="ml-2 inline" size={18} /></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {apiDown && (
        <div className="fixed inset-x-0 top-0 z-50 bg-[#ef3f30] px-5 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-white">
          API indisponible — démarrez le backend (voir /server, npm run dev) pour charger les données live.
        </div>
      )}

      <section id="top" className="hero-section relative flex min-h-[92vh] items-end overflow-hidden border-b border-white/10 px-5 pb-10 pt-32 md:px-10 md:pb-16">
        <Image src="/world-cup-hero.png" alt="Ballon de football dans un stade abstrait" fill priority className="hero-image object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/30 to-black/20" />
        <div className="hero-content relative z-10 w-full">
          <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.28em] text-white/60">
            Plateforme officielle de suivi // {groups.length ? `${groups.length} groupes chargés` : "chargement…"}
          </p>
          <h1 className="max-w-5xl text-[17vw] font-semibold leading-[.8] tracking-[-.09em] md:text-[12vw]">
            <RevealWords text="WORLD" />
            <br />
            <span className="text-[#ef3f30]"><RevealWords text="CONTROL" delay={0.15} /></span>
            <span className="align-top text-[5vw] tracking-[-.05em]">™</span>
          </h1>
          <div className="mt-10 flex flex-col justify-between gap-6 border-t border-white/20 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 md:flex-row md:items-center">
            <span>Canada · Mexico · USA</span>
            <span>11 Juin — 19 Juillet 2026</span>
            {nextMatch ? (
              <div className="flex items-center gap-4">
                <span className="text-white/50">Prochain match dans</span>
                <Countdown target={nextMatch.kickoff_at} />
              </div>
            ) : (
              <span className="text-white">[ Phase de groupes terminée — voir les résultats ]</span>
            )}
          </div>
        </div>
      </section>

      <Marquee
        items={teamNames.length ? teamNames : ["Chargement des 48 équipes qualifiées"]}
        className="border-b border-white/10 bg-white/[.03] py-4 text-white/60"
      />

      <section id="overview" className="grid gap-12 border-b border-white/10 px-5 py-24 md:grid-cols-[1fr_2fr] md:px-10 md:py-32">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">01 / Le tournoi</p>
        <div>
          <h2 className="max-w-4xl text-4xl font-medium leading-[.95] tracking-[-.055em] md:text-7xl">
            <RevealWords text="La donnée brute devient une" />{" "}
            <span className="text-[#ef3f30]"><RevealWords text="expérience vivante." delay={0.1} /></span>
          </h2>
          <Reveal delay={0.15}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/55">
              Un espace de contrôle pensé pour suivre les 48 équipes, 104 matchs et chaque moment décisif de la
              première Coupe du Monde à 48 nations — classement calculé automatiquement à chaque résultat.
            </p>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-px border border-white/15 bg-white/15 md:grid-cols-4">
            <Stat n="48" l="équipes" />
            <Stat n="104" l="matchs" delay={0.1} />
            <Stat n="16" l="villes hôtes" delay={0.2} />
            <Stat n="12" l="groupes" delay={0.3} />
          </div>
        </div>
      </section>

      <section id="matches" className="border-b border-white/10 px-5 py-20 md:px-10 md:py-28">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">02 / Centre de matchs</p>
            <h2 className="mt-5 text-5xl font-medium tracking-[-.07em] md:text-8xl">
              <RevealWords text="Calendrier &" />
              <br />
              <span className="text-[#ef3f30]"><RevealWords text="résultats." delay={0.1} /></span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex border border-white/20 font-mono text-[10px] uppercase tracking-widest">
              <button
                onClick={() => setView("liste")}
                data-active={view === "liste"}
                className="px-3 py-2 text-white/60 hover:text-white data-[active=true]:bg-white data-[active=true]:text-black"
              >
                Liste
              </button>
              <button
                onClick={() => setView("calendrier")}
                data-active={view === "calendrier"}
                className="border-l border-white/20 px-3 py-2 text-white/60 hover:text-white data-[active=true]:bg-white data-[active=true]:text-black"
              >
                Calendrier
              </button>
            </div>
            <div className="flex items-center gap-2 border border-white/20 px-3 py-2">
              <Search size={13} className="text-white/40" />
              <input
                aria-label="Rechercher un match"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher"
                className="w-28 bg-transparent font-mono text-[10px] uppercase outline-none placeholder:text-white/35"
              />
            </div>
            <select
              aria-label="Filtrer par statut"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-white/20 bg-[#050505] px-3 font-mono text-[10px] uppercase"
            >
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              aria-label="Filtrer par groupe"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="border border-white/20 bg-[#050505] px-3 font-mono text-[10px] uppercase"
            >
              <option>Tous</option>
              {GROUP_LETTERS.map((l) => (
                <option key={l} value={l}>Groupe {l}</option>
              ))}
            </select>
            <select
              aria-label="Filtrer par équipe"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-white/20 bg-[#050505] px-3 font-mono text-[10px] uppercase"
            >
              <option>Tous</option>
              {teamNames.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {view === "calendrier" && (
          <div className="mb-8 max-w-sm">
            <MatchCalendar matches={matches} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          </div>
        )}

        <div className="divide-y divide-white/10 border-y border-white/10">
          {loading && <p className="py-10 font-mono text-xs uppercase text-white/40">Chargement des matchs…</p>}
          {!loading && filtered.length === 0 && (
            <p className="py-10 font-mono text-xs uppercase text-white/40">Aucun match ne correspond à votre recherche.</p>
          )}
          {filtered.slice(0, 24).map((m, i) => (
            <Reveal key={m.id} delay={Math.min(i * 0.03, 0.3)}>
              <article className="match-row group grid grid-cols-[.7fr_1.6fr_1fr_.7fr] items-center gap-3 py-6 font-mono text-[11px] uppercase md:grid-cols-[.7fr_1.8fr_1fr_.7fr]">
                <span className="text-white/40">
                  {new Date(m.kickoff_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  {m.group_name ? ` · ${m.group_name.replace("Groupe ", "GR. ")}` : ""}
                </span>
                <div className="flex items-center text-xl font-sans font-medium normal-case tracking-tight md:text-3xl">
                  <span>{m.home_flag} {m.home_team}</span>
                  <span className="mx-3 text-[#ef3f30]">
                    {m.status === "TERMINE" ? `${m.home_score} – ${m.away_score}` : "vs"}
                  </span>
                  <span>{m.away_team} {m.away_flag}</span>
                </div>
                <span className="text-white/45">
                  {m.stadium ?? "—"}
                  {m.referee_name ? <span className="block text-white/25">🧑‍⚖️ {m.referee_name}</span> : null}
                </span>
                <span className="flex items-center justify-end gap-2 text-right">
                  {m.status === "EN_COURS" && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#ef3f30]" />}
                  {m.status === "TERMINE" ? "Terminé" : new Date(m.kickoff_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  <ArrowUpRight className="hidden group-hover:inline" size={14} />
                </span>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase text-white/35">
          Données servies par l'API REST Express (/server) · le classement se recalcule automatiquement dès qu'un score est enregistré.
        </p>
      </section>

      <section id="ranking" className="border-b border-white/10 px-5 py-20 md:px-10 md:py-28">
        <div className="mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">03 / Classement automatique</p>
            <h2 className="mt-5 text-5xl font-medium tracking-[-.07em] md:text-8xl">
              Top<br /><span className="text-[#ef3f30]">sélections.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-1 md:max-w-md md:justify-end">
            {GROUP_LETTERS.map((l) => (
              <button
                key={l}
                data-active={activeGroup === l}
                onClick={() => setActiveGroup(l)}
                className="group-tab border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-white data-[active=true]:text-white"
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[640px] divide-y divide-white/15 border-y border-white/15">
            <div className="grid grid-cols-[.4fr_2fr_.6fr_.6fr_.6fr_.6fr_.6fr_.7fr] py-3 font-mono text-[9px] uppercase tracking-widest text-white/35">
              <span>#</span><span>Équipe</span><span>J</span><span>G</span><span>N</span><span>P</span><span>+/-</span><span className="text-right">Pts</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={activeGroup} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {(standings?.standings ?? []).map((r) => (
                  <div key={r.team_id} className={`rank-row grid grid-cols-[.4fr_2fr_.6fr_.6fr_.6fr_.6fr_.6fr_.7fr] items-center py-4 font-mono text-xs ${r.position <= 2 ? "podium" : ""}`}>
                    <span className="text-white/35">{String(r.position).padStart(2, "0")}</span>
                    <span className="font-sans text-lg font-medium tracking-tight normal-case">{r.flag} {r.name}</span>
                    <span className="text-white/50">{r.joues}</span>
                    <span className="text-white/50">{r.gagnes}</span>
                    <span className="text-white/50">{r.nuls}</span>
                    <span className="text-white/50">{r.perdus}</span>
                    <span className="text-white/50">{r.diff > 0 ? `+${r.diff}` : r.diff}</span>
                    <span className="text-right text-base font-semibold text-white">{r.points}</span>
                  </div>
                ))}
                {!standings && <p className="py-10 font-mono text-xs uppercase text-white/40">Chargement du classement…</p>}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section id="stats" className="relative overflow-hidden bg-[#ef3f30] px-5 py-24 text-black md:px-10 md:py-36">
        <div className="absolute right-10 top-10 opacity-20">
          <CircleDot size={180} strokeWidth={0.6} />
        </div>
        <p className="relative font-mono text-[10px] uppercase tracking-[0.2em]">04 / Intelligence joueur</p>
        <div className="relative mt-12 grid gap-12 md:grid-cols-[1.1fr_1fr_1fr]">
          <h2 className="text-[16vw] font-semibold leading-[.75] tracking-[-.1em] md:text-[11vw] md:col-span-1">
            GAME<br />DATA.
          </h2>
          <div className="self-end border-t border-black/30 pt-4">
            <p className="font-mono text-xs uppercase tracking-widest">Meilleurs buteurs</p>
            <ul className="mt-6 space-y-3">
              {scorers.length === 0 && (
                <li className="font-mono text-sm normal-case text-black/60">
                  Aucun but enregistré pour le moment — les statistiques se mettent à jour dès le coup de sifflet final.
                </li>
              )}
              {scorers.map((s, i) => (
                <li key={s.player_id} className="flex items-center justify-between border-b border-black/15 pb-2 font-mono text-sm">
                  <span className="flex items-center gap-3">
                    <Trophy size={13} className={i === 0 ? "opacity-100" : "opacity-0"} />
                    {s.team_flag} {s.player_name}
                    <span className="text-black/50">({s.team_code})</span>
                  </span>
                  <span className="text-lg font-sans font-semibold">{s.goals}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="self-end border-t border-black/30 pt-4">
            <p className="font-mono text-xs uppercase tracking-widest">Discipline (cartons)</p>
            <ul className="mt-6 space-y-3">
              {discipline.length === 0 && (
                <li className="font-mono text-sm normal-case text-black/60">Aucun carton distribué pour le moment.</li>
              )}
              {discipline.map((s) => (
                <li key={s.player_id} className="flex items-center justify-between border-b border-black/15 pb-2 font-mono text-sm">
                  <span className="flex items-center gap-2">
                    {s.team_flag} {s.player_name} <span className="text-black/50">({s.team_code})</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {s.yellow_cards > 0 && <span className="inline-block h-4 w-3 bg-yellow-400" title="Cartons jaunes" />}
                    {s.red_cards > 0 && <span className="inline-block h-4 w-3 bg-red-600" title="Cartons rouges" />}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="infra" className="border-b border-white/10 px-5 py-20 md:px-10 md:py-28">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">05 / Infrastructures</p>
        <h2 className="mt-5 text-5xl font-medium tracking-[-.07em] md:text-8xl">
          Stades &<br /><span className="text-[#ef3f30]">arbitrage.</span>
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-px border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {stadiums.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i * 0.03, 0.3)} className="bg-[#050505] p-5 transition-transform duration-300 hover:-translate-y-1.5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/40">{s.city}</p>
              <p className="mt-2 text-lg font-medium tracking-tight">{s.name}</p>
              <p className="mt-3 font-mono text-xs text-[#ef3f30]">{s.capacity ? `${s.capacity.toLocaleString("fr-FR")} places` : "Capacité —"}</p>
            </Reveal>
          ))}
          {stadiums.length === 0 && <p className="col-span-full bg-[#050505] p-8 font-mono text-xs uppercase text-white/40">Chargement des stades…</p>}
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <RevealLine className="mb-14 h-px bg-white/20" />
        </Reveal>
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <h3 className="max-w-2xl text-4xl font-medium leading-[.95] tracking-[-.05em] md:text-6xl">
            <RevealWords text="Suivez chaque match, en direct." />
          </h3>
          <MagneticButton>
            <Link href="/connexion" data-cursor data-cursor-label="Go" className="inline-flex items-center gap-3 bg-[#f0efea] px-6 py-4 font-mono text-xs uppercase tracking-widest text-black hover:bg-[#ef3f30] hover:text-white">
              Créer un compte <ArrowUpRight size={16} />
            </Link>
          </MagneticButton>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/45 md:flex-row">
          <span>FIFA26 / CONTROL</span>
          <span>© 2026 · Interface de suivi non officielle</span>
          <span className="flex gap-4">
            <ChevronDown className="rotate-180" size={13} />
            <Link href="/admin" className="hover:text-white">Espace organisateur</Link>
          </span>
        </div>
      </footer>
    </main>
  )
}

function Stat({ n, l, delay = 0 }: { n: string; l: string; delay?: number }) {
  return (
    <Reveal delay={delay} className="stat-card bg-[#050505] p-5 transition-transform duration-300 hover:-translate-y-1.5 md:p-6">
      <p className="text-3xl font-sans tracking-[-.07em] md:text-5xl">{n}</p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-white/45">{l}</p>
    </Reveal>
  )
}
