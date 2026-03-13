import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop tattoo aftercare, piercing aftercare, skincare products and gift cards at Midnight Studio Glasgow. Aftercare solution, healing cream, and more.",
  keywords: ["tattoo aftercare products", "piercing aftercare", "tattoo healing cream", "aftercare solution", "tattoo shop Glasgow", "body art products"],
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
