"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Curseur personnalisé avec effet "magnétique" au survol des éléments
 * interactifs — inspiré de la structure d'interaction de haoqi.design.
 * Désactivé automatiquement sur écrans tactiles et si l'utilisateur préfère
 * une expérience à mouvement réduit.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (isTouch || reduced) return
    setEnabled(true)

    let ringX = 0
    let ringY = 0
    let mouseX = 0
    let mouseY = 0
    let raf = 0

    function onMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`
      }
    }

    function loop() {
      ringX += (mouseX - ringX) * 0.16
      ringY += (mouseY - ringY) * 0.16
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }

    function onOver(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest("[data-cursor]") as HTMLElement | null
      setHovering(!!target)
      setLabel(target?.getAttribute("data-cursor-label") ?? null)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("mouseover", onOver, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseover", onOver)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-[#ef3f30] mix-blend-difference"
        style={{ transition: "opacity .2s ease" }}
        aria-hidden
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] flex items-center justify-center rounded-full border border-white/70 mix-blend-difference"
        style={{
          width: hovering ? 84 : 32,
          height: hovering ? 84 : 32,
          transition: "width .3s cubic-bezier(.22,1,.36,1), height .3s cubic-bezier(.22,1,.36,1), border-color .3s ease",
        }}
        aria-hidden
      >
        {label && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-white">{label}</span>
        )}
      </div>
    </>
  )
}
