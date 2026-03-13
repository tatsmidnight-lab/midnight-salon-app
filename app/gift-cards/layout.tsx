import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gift Cards",
  description: "Buy gift cards for tattoo, piercing and eyelash services at Midnight Studio Glasgow. The perfect gift for any occasion.",
  keywords: ["tattoo gift card Glasgow", "piercing gift voucher", "eyelash gift card", "body art gift", "Midnight Studio gift card"],
}

export default function GiftCardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
