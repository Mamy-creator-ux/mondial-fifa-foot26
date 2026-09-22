"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

const easeOut = [0.22, 1, 0.36, 1] as const

/** Révèle un bloc au scroll (translateY + fade), une seule fois. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.9, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Révèle un texte mot par mot, effet "kinetic typography" (façon studio de design). */
export function RevealWords({
  text,
  className,
  delay = 0,
  stagger = 0.045,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
}) {
  const reduced = useReducedMotion()
  const words = text.split(" ")

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }
  const word: Variants = {
    hidden: { opacity: 0, y: "100%" },
    show: { opacity: 1, y: "0%", transition: { duration: 0.75, ease: easeOut } },
  }

  if (reduced) return <span className={className}>{text}</span>

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[.08em] align-bottom" aria-hidden>
          <motion.span className="inline-block" variants={word}>
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  )
}

/** Ligne qui se trace de gauche à droite au scroll (séparateurs de section). */
export function RevealLine({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? undefined : { scaleX: 0 }}
      whileInView={reduced ? undefined : { scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, ease: easeOut }}
      style={{ transformOrigin: "left" }}
      className={className}
    />
  )
}
