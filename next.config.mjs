/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export statique : `npm run build` génère un dossier out/ prêt à être
  // téléversé directement dans Cloudflare Pages (aucun serveur Node requis
  // pour le frontend — toutes les données viennent de l'API Express et de
  // Supabase, interrogées côté client).
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
