import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Services",
  description: "Browse our tattoo, piercing, eyelash and micropigmentation services. Custom tattoos from £40, piercings from £20, lash extensions, lip blush, microblading. Book online at Midnight Studio Glasgow.",
  keywords: ["tattoo services Glasgow", "piercing prices", "eyelash extensions cost", "micropigmentation Glasgow", "custom tattoo booking", "fine line tattoo", "full sleeve tattoo price", "nose piercing Glasgow", "septum piercing", "lash lift Glasgow", "lip blush Glasgow", "microblading Scotland"],
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
