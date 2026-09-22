"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { Reveal, RevealWords } from "@/components/reveal"
import { api, type Group, type Player, type Coach } from "@/lib/api"

const POSITION_LABELS: Record<string, string> = {
  GARDIEN: "Gardien",
  DEFENSEUR: "Défenseur",
  MILIEU: "Milieu",
  ATTAQUANT: "Attaquant",
}

export default function EquipesPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [coach, setCoach] = useState<Coach | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .groups()
      .then((r) => {
        setGroups(r.groups)
        const first = r.groups[0]?.teams[0]
        if (first) setSelectedTeam(first.id)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedTeam) return
    api.players(selectedTeam).then((r) => setPlayers(r.players))
    api.coaches(selectedTeam).then((r) => setCoach(r.coaches[0] ?? null))
  }, [selectedTeam])

  const allTeams = useMemo(() => groups.flatMap((g) => g.teams.map((t) => ({ ...t, group_name: g.name }))), [groups])
  const filteredTeams = allTeams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
  const activeTeam = allTeams.find((t) => t.id === selectedTeam)

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-8 text-[#f1f0eb] md:px-10">
      <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white">
        <ArrowLeft size={13} /> Retour à FIFA26
      </Link>

      <div className="mt-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Effectifs</p>
        <h1 className="mt-4 text-5xl font-medium tracking-[-.06em] md:text-7xl">
          <RevealWords text="Équipes, joueurs" /> <br />
          <span className="text-[#ef3f30]"><RevealWords text="& entraîneurs." delay={0.1} /></span>
        </h1>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside>
          <div className="mb-4 flex items-center gap-2 border border-white/20 px-3 py-2">
            <Search size={13} className="text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une équipe"
              aria-label="Rechercher une équipe"
              className="w-full bg-transparent font-mono text-[11px] uppercase outline-none placeholder:text-white/35"
            />
          </div>
          <div className="max-h-[65vh] overflow-y-auto border-y border-white/10">
            {loading && <p className="py-6 font-mono text-xs uppercase text-white/40">Chargement…</p>}
            {filteredTeams.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t.id)}
                data-active={selectedTeam === t.id}
                className="flex w-full items-center justify-between border-b border-white/10 px-2 py-3 text-left font-mono text-xs uppercase tracking-wide text-white/60 last:border-b-0 hover:text-white data-[active=true]:bg-white/[.06] data-[active=true]:text-white"
              >
                <span>{t.flag} {t.name}</span>
                <span className="text-white/30">{t.group_name?.replace("Groupe ", "")}</span>
              </button>
            ))}
          </div>
        </aside>

        <section>
          {activeTeam && (
            <Reveal key={activeTeam.id}>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{activeTeam.group_name} · {activeTeam.confederation}</p>
                  <h2 className="mt-2 text-4xl font-medium tracking-[-.05em] md:text-5xl">{activeTeam.flag} {activeTeam.name}</h2>
                </div>
                {activeTeam.fifa_rank && (
                  <p className="font-mono text-xs uppercase text-white/50">Classement FIFA <span className="text-white">#{activeTeam.fifa_rank}</span></p>
                )}
              </div>

              <div className="mb-10 border border-white/15 bg-white/[.03] p-5">
                <p className="font-mono text-[9px] uppercase tracking-widest text-white/40">Sélectionneur</p>
                <p className="mt-2 text-2xl font-medium tracking-tight">{coach ? coach.name : "Non renseigné"}</p>
                {coach?.nationality && <p className="mt-1 font-mono text-xs text-white/50">{coach.nationality}</p>}
              </div>

              <p className="mb-4 font-mono text-[9px] uppercase tracking-widest text-white/40">
                Effectif ({players.length} joueurs)
              </p>
              <div className="divide-y divide-white/10 border-y border-white/10">
                {players.map((p) => (
                  <div key={p.id} className="grid grid-cols-[.3fr_2fr_1fr] items-center gap-3 py-4 font-mono text-xs uppercase">
                    <span className="text-2xl font-sans font-semibold text-white/20">{p.number ?? "—"}</span>
                    <span className="text-base font-sans font-medium normal-case tracking-tight text-white">{p.name}</span>
                    <span className="text-white/45">{POSITION_LABELS[p.position] ?? p.position}</span>
                  </div>
                ))}
                {players.length === 0 && <p className="py-8 text-xs uppercase text-white/40">Aucun joueur enregistré pour cette équipe.</p>}
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase text-white/30">
                Effectif de démonstration généré automatiquement — à personnaliser depuis l'espace organisateur (/admin).
              </p>
            </Reveal>
          )}
        </section>
      </div>
    </main>
  )
}
