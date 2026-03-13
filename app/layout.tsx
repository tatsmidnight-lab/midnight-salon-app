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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://midnightt.top"),
  title: {
    default: "MidNight Tattoo & Piercing | Camden Town, London",
    template: "%s — MidNight Tattoo & Piercing",
  },
  description:
    "Premium tattoo and piercing studio in Camden Town, London. Custom tattoos, fine line, realism, blackwork, full sleeves, portraits, ear piercings, facial piercings, body piercings. 13+ years experience. Book online at midnightt.top.",
  keywords: [
    "tattoo Camden",
    "tattoo London",
    "piercing Camden",
    "piercing London",
    "custom tattoo London",
    "fine line tattoo",
    "realism tattoo",
    "blackwork tattoo",
    "full sleeve tattoo",
    "portrait tattoo",
    "nose piercing",
    "septum piercing",
    "ear piercing London",
    "helix piercing",
    "tragus piercing",
    "body piercing Camden",
    "tattoo studio near me",
    "best tattoo artist London",
    "tattoo aftercare",
    "piercing aftercare",
    "tattoo booking online",
    "midnight tattoo",
    "midnightt.top",
    "Camden High Street tattoo",
  ],
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "MidNight Tattoo & Piercing",
    title: "MidNight Tattoo & Piercing | Camden Town, London",
    description: "Premium tattoo and piercing studio in Camden Town, London. Custom designs, realism, fine line, blackwork, professional piercings. 13+ years experience. Book online.",
    images: [{ url: "/logo.jpg", width: 512, height: 512, alt: "MidNight Tattoo & Piercing Camden" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MidNight Tattoo & Piercing | Camden, London",
    description: "Premium tattoo and piercing studio in Camden Town, London. Custom designs, 13+ years experience. Book online.",
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
              name: "MidNight Tattoo & Piercing",
              description: "Premium tattoo and piercing studio in Camden Town, London. Custom designs, realism, fine line, blackwork. 13+ years experience.",
              url: "https://midnightt.top",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Unit 12, 190 Camden High Street",
                addressLocality: "London",
                postalCode: "NW1 8QP",
                addressCountry: "GB",
              },
              telephone: "+447958747929",
              openingHours: "Mo-Su 11:00-23:00",
              priceRange: "££",
              image: "/logo.jpg",
              sameAs: ["https://www.instagram.com/midnight.tats/", "https://www.instagram.com/kingzz.uk/"],
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
          <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-white/40">
            <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>&copy; {new Date().getFullYear()} MidNight Tattoo &amp; Piercing, Camden Town, London</p>
              <div className="flex gap-4">
                <a href="/terms" className="hover:text-white/70 transition-colors">Terms of Service</a>
                <a href="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</a>
                <a href="/contact" className="hover:text-white/70 transition-colors">Contact</a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
