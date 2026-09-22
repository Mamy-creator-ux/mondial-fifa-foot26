"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bell } from "lucide-react"
import { api, type Notification } from "@/lib/api"

/**
 * Fil de notifications en direct : interroge l'API à intervalle régulier
 * (Fetch API) et met à jour l'interface sans rechargement de page.
 */
export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const lastSeen = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await api.notifications()
        if (cancelled) return
        setItems(res.notifications)
        if (lastSeen.current) {
          const fresh = res.notifications.filter((n) => n.created_at > lastSeen.current!)
          if (fresh.length) setUnread((u) => u + fresh.length)
        }
        if (res.notifications[0]) lastSeen.current = res.notifications[0].created_at
      } catch {
        // API indisponible : on réessaiera au prochain intervalle, sans bloquer l'UI
      }
    }

    poll()
    const id = setInterval(poll, 15000) // mise à jour sans rechargement, toutes les 15s
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  function toggle() {
    setOpen((o) => !o)
    if (!open) setUnread(0)
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        data-cursor
        data-cursor-label="Fil"
        className="relative rounded-full border border-white/20 p-2.5 text-white/80 hover:text-white"
      >
        <Bell size={14} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef3f30] text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-3 w-72 border border-white/15 bg-[#0a0a0a] p-2 shadow-2xl"
          >
            <p className="px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-white/40">Fil d'actualité</p>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-2 py-4 font-mono text-[11px] uppercase text-white/40">Aucune notification pour le moment.</p>
              )}
              {items.map((n) => (
                <div key={n.id} className="border-t border-white/10 px-2 py-3 first:border-t-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#ef3f30]">{n.title}</p>
                  <p className="mt-1 text-xs normal-case text-white/70">{n.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
