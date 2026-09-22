"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export default function ConnexionPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setNotice("")
    setLoading(true)

    try {
      if (mode === "sign-in") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (err) {
          setError("Adresse email ou mot de passe incorrect. Si vous n'avez pas encore de compte, utilisez Inscription.")
          return
        }
      } else {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        })
        if (err) {
          setError("Impossible de créer ce compte. Utilisez un mot de passe d'au moins 8 caractères.")
          return
        }
        setNotice("Compte créé. Si la confirmation par email est activée sur votre projet Supabase, vérifiez votre boîte de réception avant de vous connecter.")
      }
    } catch {
      setError("Le service de connexion est momentanément indisponible. Réessayez dans quelques instants.")
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-8 text-[#f0efea] sm:px-10">
      <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-[#aaa] hover:text-white">
        ← Retour à FIFA26
      </Link>
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <section className="w-full border border-white/15 bg-white/[.03] p-6 sm:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#ef3f30]">FIFA26 / COMPTE</p>

          {session === undefined && <p className="mt-6 font-mono text-xs uppercase text-white/40">Chargement…</p>}

          {session === null && (
            <>
              <h1 className="mt-5 font-serif text-5xl tracking-[-.05em]">{mode === "sign-in" ? "Connexion" : "Inscription"}</h1>
              <p className="mt-3 text-sm text-[#aaa]">Accédez à votre espace supporter championnat (Supabase Auth).</p>
              <p className="mt-1 text-xs text-[#666]">
                Vous organisez le tournoi ?{" "}
                <Link href="/admin" className="underline underline-offset-4 hover:text-white">
                  Espace organisateur →
                </Link>
              </p>
              <form onSubmit={submit} className="mt-8 space-y-4">
                {mode === "sign-up" && (
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#ef3f30]"
                  />
                )}
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
                  minLength={8}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe (8 caractères minimum)"
                  className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#ef3f30]"
                />
                {error && (
                  <p role="alert" aria-live="polite" className="text-sm text-[#ef3f30]">
                    {error}
                  </p>
                )}
                {notice && (
                  <p role="status" aria-live="polite" className="text-sm text-emerald-400">
                    {notice}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#ef3f30] px-4 py-4 font-mono text-xs uppercase tracking-[.2em] text-white transition hover:bg-white hover:text-black disabled:opacity-50"
                >
                  {loading ? "Chargement…" : mode === "sign-in" ? "Se connecter" : "Créer mon compte"}
                </button>
              </form>
              <button
                onClick={() => {
                  setMode(mode === "sign-in" ? "sign-up" : "sign-in")
                  setError("")
                  setNotice("")
                }}
                className="mt-6 font-mono text-[10px] uppercase tracking-widest text-[#aaa] underline underline-offset-4 hover:text-white"
              >
                {mode === "sign-in" ? "Créer un compte" : "J'ai déjà un compte"}
              </button>
            </>
          )}

          {session && (
            <>
              <h1 className="mt-5 font-serif text-5xl tracking-[-.05em]">Bienvenue</h1>
              <p className="mt-3 text-sm text-[#aaa]">
                Connecté en tant que <span className="text-white">{session.user.email}</span>
              </p>
              <button
                onClick={logout}
                className="mt-8 w-full bg-[#f0efea] px-4 py-4 font-mono text-xs uppercase tracking-[.2em] text-black transition hover:bg-[#ef3f30] hover:text-white"
              >
                Se déconnecter
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
