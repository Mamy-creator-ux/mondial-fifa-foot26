"use client"

import { motion, useScroll, useSpring } from "framer-motion"
import { useEffect, useRef, useState, type ReactNode } from "react"

/** Barre de progression du scroll, en haut de l'écran. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 })
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden />
}

/** Horloge live multi-fuseaux (façon studio créatif : villes hôtes du tournoi). */
export function LiveClock({ zone, label }: { zone: string; label: string }) {
  const [time, setTime] = useState("--:--:--")

  useEffect(() => {
    function tick() {
      try {
        setTime(
          new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: zone }).format(
            new Date()
          )
        )
      } catch {
        setTime("--:--:--")
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [zone])

  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
      {label} <span className="countdown-digit text-white/80">{time}</span>
    </span>
  )
}

/** Bouton avec effet magnétique : suit légèrement le curseur au survol. */
export function MagneticButton({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`
  }
  function onLeave() {
    if (ref.current) ref.current.style.transform = "translate(0,0)"
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`magnetic ${className ?? ""}`}>
      {children}
    </div>
  )
}

/** Compte à rebours avant le coup d'envoi du tournoi. */
export function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState<{ j: number; h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, new Date(target).getTime() - Date.now())
      const s = Math.floor(diff / 1000)
      setLeft({ j: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  if (!left) return null

  const units: [number, string][] = [
    [left.j, "jours"],
    [left.h, "heures"],
    [left.m, "min"],
    [left.s, "sec"],
  ]

  return (
    <div className="flex gap-6 font-mono">
      {units.map(([v, l]) => (
        <div key={l} className="flex flex-col items-center">
          <span className="countdown-digit text-3xl font-semibold tracking-tight md:text-5xl">{String(v).padStart(2, "0")}</span>
          <span className="mt-1 text-[9px] uppercase tracking-widest text-white/45">{l}</span>
        </div>
      ))}
    </div>
  )
}
