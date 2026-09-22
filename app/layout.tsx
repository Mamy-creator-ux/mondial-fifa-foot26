import type { Metadata, Viewport } from "next"
import "./globals.css"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FIFA26 / Control — Coupe du Monde 2026",
    template: "%s · FIFA26 / Control",
  },
  description:
    "Plateforme immersive de suivi de la Coupe du Monde FIFA 2026 : calendrier, classement calculé automatiquement, statistiques des joueurs.",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "FIFA26 / Control — Coupe du Monde 2026",
    description: "Calendrier, classement automatique et statistiques en direct de la Coupe du Monde 2026.",
    url: siteUrl,
    siteName: "FIFA26 / Control",
    locale: "fr_FR",
    type: "website",
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
