"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Match } from "@/lib/api"

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

/**
 * Calendrier mensuel interactif : navigation mois par mois, points
 * indiquant les jours avec match, clic sur un jour pour filtrer la liste.
 */
export function MatchCalendar({
  matches,
  selectedDay,
  onSelectDay,
}: {
  matches: Match[]
  selectedDay: string | null
  onSelectDay: (day: string | null) => void
}) {
  const initial = matches[0] ? new Date(matches[0].kickoff_at) : new Date("2026-06-11")
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1))

  const matchesByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of matches) {
      const d = new Date(m.kickoff_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [matches])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7 // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (string | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ]

  return (
    <div className="border border-white/15 bg-white/[.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          aria-label="Mois précédent"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-full border border-white/15 p-1.5 hover:border-white/40"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="font-mono text-xs uppercase tracking-widest">
          {MONTHS_FR[month]} {year}
        </p>
        <button
          aria-label="Mois suivant"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-full border border-white/15 p-1.5 hover:border-white/40"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 font-mono text-[9px] uppercase tracking-widest text-white/40">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((key, i) => {
          if (!key) return <div key={`empty-${i}`} />
          const count = matchesByDay.get(key) ?? 0
          const day = Number(key.slice(-2))
          const isSelected = selectedDay === key
          return (
            <button
              key={key}
              onClick={() => onSelectDay(isSelected ? null : key)}
              disabled={count === 0}
              className={`relative flex aspect-square flex-col items-center justify-center border text-xs transition-colors ${
                isSelected
                  ? "border-[#ef3f30] bg-[#ef3f30] text-white"
                  : count > 0
                  ? "border-white/20 hover:border-white/50"
                  : "border-transparent text-white/25"
              }`}
            >
              {day}
              {count > 0 && !isSelected && <span className="mt-0.5 h-1 w-1 rounded-full bg-[#ef3f30]" />}
            </button>
          )
        })}
      </div>
      {selectedDay && (
        <button
          onClick={() => onSelectDay(null)}
          className="mt-4 font-mono text-[10px] uppercase tracking-widest text-white/50 underline underline-offset-4 hover:text-white"
        >
          Effacer le filtre de date
        </button>
      )}
    </div>
  )
}
