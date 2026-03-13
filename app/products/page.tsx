"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import GeometricBg from "@/components/GeometricBg"

type Product = {
  id: string; name: string; description: string; price: number
  image_url: string | null; category: string; stock: number
}

const PER_PAGE_OPTIONS = [5, 10, 15]

const FALLBACK_PRODUCTS: Product[] = [
  { id: "p1", name: "Piercing Care Solution", description: "Antimicrobial piercing spray for daily cleaning. Sterile saline formula for optimal healing.", price: 5, image_url: null, category: "aftercare", stock: 50 },
  { id: "p2", name: "Tattoo Aftercare Cream", description: "Premium healing balm with vitamins A & E. Keeps tattoos moisturised and promotes vibrant colour.", price: 10, image_url: null, category: "aftercare", stock: 50 },
  { id: "p3", name: "Tattoo Aftercare Kit", description: "Complete bundle — cleaning solution, healing cream and protective film. Everything for the first 2 weeks.", price: 15, image_url: null, category: "aftercare", stock: 30 },
  { id: "p4", name: "SPF50 Tattoo Sunscreen", description: "High-protection sunscreen for tattooed skin. Prevents fading from UV exposure. Water-resistant, 100ml.", price: 13, image_url: null, category: "aftercare", stock: 40 },
  { id: "p5", name: "Antibacterial Soap Bar", description: "Gentle fragrance-free soap for tattoo and piercing cleaning. pH balanced, no harsh chemicals.", price: 6, image_url: null, category: "aftercare", stock: 60 },
  { id: "p6", name: "Titanium Piercing Jewellery", description: "Implant-grade titanium replacement jewellery. Studs, hoops, barbells and horseshoes. Hypoallergenic.", price: 12, image_url: null, category: "jewellery", stock: 25 },
  { id: "p7", name: "Gold Plated Nose Ring", description: "18K gold plated surgical steel nose ring. Available in 8mm and 10mm. Seamless hoop design.", price: 18, image_url: null, category: "jewellery", stock: 20 },
  { id: "p8", name: "Midnight Branded Tee", description: "Official Midnight Studio t-shirt. 100% organic cotton, unisex fit. Black with embroidered logo.", price: 25, image_url: null, category: "merch", stock: 15 },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [activeCategory, setActiveCategory] = useState("all")
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [cartBounce, setCartBounce] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const stickyCartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    fetch("/api/products/get-all-products", { signal: controller.signal })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const items = Array.isArray(data) ? data.filter((p: Product) => p.category !== "gift_card") : []
        setProducts(items.length > 0 ? items : FALLBACK_PRODUCTS)
      })
      .catch(() => setProducts(FALLBACK_PRODUCTS))
      .finally(() => { clearTimeout(timeout); setLoading(false) })
    return () => { clearTimeout(timeout); controller.abort() }
  }, [])

  const syncCart = useCallback(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("midnight_cart") || "[]")
      setCartCount(cart.length)
      setCartTotal(cart.reduce((sum: number, item: { price: number }) => sum + (item.price || 0), 0))
    } catch {}
  }, [])

  useEffect(() => { syncCart() }, [syncCart])

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]

  const filtered = activeCategory === "all" ? products : products.filter((p) => p.category === activeCategory)
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const addToCart = (product: Product) => {
    try {
      const cart = JSON.parse(localStorage.getItem("midnight_cart") || "[]")
      cart.push({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
      localStorage.setItem("midnight_cart", JSON.stringify(cart))
      syncCart()
      // Trigger bounce animation
      setCartBounce(true)
      setLastAdded(product.name)
      setTimeout(() => setCartBounce(false), 600)
      setTimeout(() => setLastAdded(null), 2000)
    } catch {}
  }

  return (
    <div className="relative min-h-screen pt-20 pb-16">
      <GeometricBg variant="grid" />

      {/* ─── Sticky Cart Bar ─── */}
      <div
        ref={stickyCartRef}
        className={`fixed top-16 left-0 right-0 z-40 transition-all duration-500 ${
          cartCount > 0 ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="glass-strong shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`relative transition-transform ${cartBounce ? "animate-cart-bounce" : ""}`}
              >
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M5 7h14l-1.5 7H6.5z" />
                  <path d="M5 7L4 3H1" />
                  <circle cx="8" cy="18" r="1.5" fill="var(--accent-hex)" />
                  <circle cx="16" cy="18" r="1.5" fill="var(--accent-hex)" />
                </svg>
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full gradient-accent text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <div>
                <span className="text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
                <span className="text-sm mx-2" style={{ color: "hsl(var(--text-muted))" }}>&middot;</span>
                <span className="text-sm font-bold" style={{ color: "var(--accent-hex)" }}>
                  &pound;{cartTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Last added toast */}
            <div className="flex items-center gap-3">
              {lastAdded && (
                <span
                  className="text-xs animate-fade-in hidden sm:block"
                  style={{ color: "hsl(var(--text-secondary))" }}
                >
                  Added: {lastAdded}
                </span>
              )}
              <Link
                href="/cart"
                className="btn-primary !py-2 !px-5 text-xs flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 7h14l-1.5 7H6.5z" />
                  <path d="M5 7L4 3H1" />
                </svg>
                View Cart
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Shop</h1>
            <p className="mt-1" style={{ color: "hsl(var(--text-secondary))" }}>Aftercare, jewellery & more</p>
          </div>
          <Link
            href="/cart"
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-transform ${
              cartBounce ? "scale-125" : "scale-100"
            }`}
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="hsl(var(--text-primary))" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 7h14l-1.5 7H6.5z" />
              <path d="M5 7L4 3H1" />
              <circle cx="8" cy="18" r="1.5" fill="hsl(var(--text-primary))" />
              <circle cx="16" cy="18" r="1.5" fill="hsl(var(--text-primary))" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-accent text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Ad banner */}
        <div className="card-glass p-8 mb-8 text-center gradient-accent rounded-2xl">
          <h3 className="text-2xl font-bold text-white mb-2">Free Aftercare Kit</h3>
          <p className="text-white/80 text-sm">With every tattoo booking this month</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setPage(1) }}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat ? "gradient-accent text-white" : ""
                }`}
                style={activeCategory !== cat ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Show:</span>
            {PER_PAGE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => { setPerPage(n); setPage(1) }}
                className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                  perPage === n ? "gradient-accent text-white" : ""
                }`}
                style={perPage !== n ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-glass p-4 animate-pulse">
                <div className="aspect-square rounded-xl mb-3" style={{ background: "var(--surface-2-hex)" }} />
                <div className="h-4 w-2/3 rounded mb-2" style={{ background: "var(--surface-2-hex)" }} />
                <div className="h-3 w-1/3 rounded" style={{ background: "var(--surface-2-hex)" }} />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ color: "hsl(var(--text-muted))" }}>No products available</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {paginated.map((product) => (
              <div key={product.id} className="card-glass overflow-hidden group">
                <div className="aspect-square overflow-hidden relative" style={{ background: "var(--surface-2-hex)" }}>
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5">
                        <rect x="6" y="8" width="20" height="18" rx="3" />
                        <path d="M10 8V6a6 6 0 0112 0v2" />
                      </svg>
                    </div>
                  )}
                  {/* Quick add overlay */}
                  <button
                    onClick={() => addToCart(product)}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full gradient-accent text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 4v10M4 9h10" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1 line-clamp-1" style={{ color: "hsl(var(--text-primary))" }}>{product.name}</h3>
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: "hsl(var(--text-secondary))" }}>{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{product.price}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="btn-primary !py-2 !px-4 text-xs"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-primary))" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4"/></svg>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  page === i + 1 ? "gradient-accent text-white" : ""
                }`}
                style={page !== i + 1 ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-primary))" strokeWidth="1.5" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
