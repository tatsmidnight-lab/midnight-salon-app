"use client"

import { useState, useEffect } from "react"
import GeometricBg from "@/components/GeometricBg"

type Product = {
  id: string; name: string; description: string; price: number
  image_url: string | null; category: string
}

const FALLBACK_GIFT_CARDS: Product[] = [
  { id: "gc1", name: "Gift Card — £15", description: "Treat someone to piercing aftercare or products at Midnight Studio. Valid for 12 months.", price: 15, image_url: null, category: "gift_card" },
  { id: "gc2", name: "Gift Card — £50", description: "Perfect for a piercing session or aftercare bundle. Redeemable on any service or product.", price: 50, image_url: null, category: "gift_card" },
  { id: "gc3", name: "Gift Card — £100", description: "Covers a midsize tattoo, lash extensions or multiple piercings. The ideal gift for body art lovers.", price: 100, image_url: null, category: "gift_card" },
  { id: "gc4", name: "Gift Card — £200", description: "Premium gift card for custom tattoo work, micropigmentation or a full pampering session.", price: 200, image_url: null, category: "gift_card" },
  { id: "gc5", name: "Gift Card — £350", description: "The ultimate gift — covers a half sleeve, full day tattoo session or a combination of services.", price: 350, image_url: null, category: "gift_card" },
  { id: "gc6", name: "Gift Card — £750", description: "VIP gift card. Covers a full sleeve or multiple premium services. The most generous gift in body art.", price: 750, image_url: null, category: "gift_card" },
]

export default function GiftCardsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    fetch("/api/products/get-all-products", { signal: controller.signal })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const cards = Array.isArray(data) ? data.filter((p: Product) => p.category === "gift_card") : []
        setProducts(cards.length > 0 ? cards : FALLBACK_GIFT_CARDS)
      })
      .catch(() => setProducts(FALLBACK_GIFT_CARDS))
      .finally(() => { clearTimeout(timeout); setLoading(false) })
    return () => { clearTimeout(timeout); controller.abort() }
  }, [])

  const addToCart = (product: Product) => {
    try {
      const cart = JSON.parse(localStorage.getItem("midnight_cart") || "[]")
      cart.push({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
      localStorage.setItem("midnight_cart", JSON.stringify(cart))
    } catch {}
  }

  return (
    <div className="relative min-h-screen pt-20 pb-16">
      <GeometricBg variant="eyelash" />

      <div className="relative max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 48 48" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="4" y="12" width="40" height="28" rx="4" />
            <path d="M4 20h40M24 12v28" />
            <path d="M24 12c-4-6-12-4-12 0s8 6 12 8M24 12c4-6 12-4 12 0s-8 6-12 8" />
          </svg>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>Gift Cards</h1>
          <p style={{ color: "hsl(var(--text-secondary))" }}>The perfect gift for someone special</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-glass p-6 animate-pulse">
                <div className="h-40 rounded-xl mb-4" style={{ background: "var(--surface-2-hex)" }} />
                <div className="h-5 w-2/3 rounded mb-2" style={{ background: "var(--surface-2-hex)" }} />
                <div className="h-4 w-1/3 rounded" style={{ background: "var(--surface-2-hex)" }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 card-glass p-12">
            <p className="text-lg mb-4" style={{ color: "hsl(var(--text-secondary))" }}>Gift cards coming soon!</p>
            <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Contact us directly to purchase a gift card</p>
            <a href="tel:+447958747929" className="btn-primary inline-block mt-6 px-8">
              Call Us
            </a>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {products.map((product) => (
              <div key={product.id} className="card-glass overflow-hidden group" style={{ borderColor: "var(--accent-hex)", borderWidth: "1px" }}>
                <div className="h-40 gradient-accent flex items-center justify-center">
                  <svg className="w-16 h-16 text-white" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="4" y="12" width="40" height="28" rx="4" />
                    <path d="M4 20h40M24 12v28" />
                    <path d="M24 12c-4-6-12-4-12 0s8 6 12 8M24 12c4-6 12-4 12 0s-8 6-12 8" />
                  </svg>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>{product.name}</h3>
                  <p className="text-sm mb-4" style={{ color: "hsl(var(--text-secondary))" }}>{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{product.price}</span>
                    <button onClick={() => addToCart(product)} className="btn-primary !py-2 !px-5 text-sm">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
