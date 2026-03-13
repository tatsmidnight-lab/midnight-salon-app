import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Midnight Studio in Glasgow. Phone: 07958 747929. Open Monday to Sunday 11am-11pm. Find us on Instagram @midnight.tats.",
  keywords: ["Midnight Studio contact", "tattoo studio Glasgow phone", "Glasgow tattoo opening hours", "tattoo studio near me Glasgow"],
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
