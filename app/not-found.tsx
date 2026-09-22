import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#050505] px-5 text-center text-[#f1f0eb]">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#ef3f30]">Erreur 404</p>
      <h1 className="mt-6 text-[22vw] font-semibold leading-[.8] tracking-[-.09em] md:text-[14vw]">
        HORS<br />JEU.
      </h1>
      <p className="mt-8 max-w-md text-white/55">Cette page n'existe pas ou a été déplacée. Retournez au centre de contrôle.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 bg-[#f0efea] px-6 py-4 font-mono text-xs uppercase tracking-widest text-black hover:bg-[#ef3f30] hover:text-white"
      >
        Retour à l'accueil
      </Link>
    </main>
  )
}
