import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Providers from "./providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://midnight.studio"),
  title: {
    default: "Midnight — Tattoo, Piercing & Eyelash Studio | Glasgow, Scotland",
    template: "%s — Midnight Studio Glasgow",
  },
  description:
    "Premium tattoo, body piercing, eyelash extensions and micropigmentation studio in Glasgow, Scotland. Custom tattoos, fine line, full sleeve, nose piercing, septum, lash lifts, lip blush, microblading. Book online today.",
  keywords: [
    "tattoo Glasgow",
    "piercing Glasgow",
    "eyelash extensions Glasgow",
    "custom tattoo Scotland",
    "fine line tattoo",
    "full sleeve tattoo",
    "nose piercing",
    "septum piercing",
    "lobe piercing",
    "eyelash lift",
    "micropigmentation Glasgow",
    "lip blush",
    "microblading",
    "body art Glasgow",
    "tattoo studio near me",
    "best tattoo artist Glasgow",
    "tattoo aftercare",
    "piercing aftercare",
    "tattoo booking online",
    "midnight studio",
    "midnight tattoo",
  ],
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Midnight Studio",
    title: "Midnight — Tattoo, Piercing & Eyelash Studio | Glasgow",
    description: "Premium tattoo, piercing and eyelash studio in Glasgow. Custom designs, professional piercings, stunning lash extensions. Book your appointment online.",
    images: [{ url: "/logo.jpg", width: 512, height: 512, alt: "Midnight Studio Glasgow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Midnight — Tattoo, Piercing & Eyelash | Glasgow",
    description: "Premium tattoo, piercing and eyelash studio in Glasgow, Scotland. Book online today.",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans min-h-screen antialiased`}
        style={{ backgroundColor: "var(--bg-hex)" }}
      >
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TattooParlor",
              name: "Midnight Studio",
              description: "Premium tattoo, piercing and eyelash studio in Glasgow, Scotland.",
              address: { "@type": "PostalAddress", addressLocality: "Glasgow", addressCountry: "GB" },
              telephone: "+447958747929",
              openingHours: "Mo-Su 11:00-23:00",
              priceRange: "££",
              image: "/logo.jpg",
              sameAs: ["https://www.instagram.com/midnight.tats/", "https://www.tiktok.com/@midnight.tats"],
              aggregateRating: { "@type": "AggregateRating", ratingValue: "5", reviewCount: "127" },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Services",
                itemListElement: [
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Custom Tattoo" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Body Piercing" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Eyelash Extensions" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Micropigmentation" } },
                ],
              },
            }),
          }}
        />
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
