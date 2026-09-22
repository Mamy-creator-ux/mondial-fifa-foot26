"use client"

import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#050505] px-5 text-center text-[#f1f0eb]">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#ef3f30]">Erreur inattendue</p>
      <h1 className="text-4xl font-medium tracking-[-.05em] md:text-6xl">Quelque chose a mal tourné.</h1>
      <button
        onClick={reset}
        className="bg-[#f0efea] px-6 py-4 font-mono text-xs uppercase tracking-widest text-black hover:bg-[#ef3f30] hover:text-white"
      >
        Réessayer
      </button>
    </main>
  )
}
