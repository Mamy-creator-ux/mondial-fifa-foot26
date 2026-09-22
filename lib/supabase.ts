// lib/supabase.ts
// -----------------------------------------------------------------------------
// Client Supabase côté navigateur — utilisé pour l'espace « supporter »
// (inscription / connexion) via Supabase Auth. Les données du championnat
// (équipes, matchs, classement...) transitent, elles, par l'API REST
// Node.js + Express (voir lib/api.ts) qui se connecte à la même base
// Supabase côté serveur.
// -----------------------------------------------------------------------------
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qeepewjluwgdwzswvyql.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_mJSzmjgwa749tRgPItPEmA_UdhJ0oUN"

if (typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
  // Avertissement uniquement — n'empêche pas le reste du site de fonctionner.
  console.warn(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquants. " +
      "L'espace supporter (/connexion) ne pourra pas s'authentifier. Voir .env.example."
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
