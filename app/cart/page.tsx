"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import GeometricBg from "@/components/GeometricBg"

type CartItem = {
  id: string
  name: string
  price: number
  image_url: string | null
  quantity: number
}

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Coupon
  const [couponCode, setCouponCode] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string; description: string; discount_type: string
    discount_value: number; discount_amount: number
  } | null>(null)

  const loadCart = useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("midnight_cart") || "[]")
      // Group by product id and sum quantities
      const map = new Map<string, CartItem>()
      for (const item of raw) {
        const existing = map.get(item.id)
        if (existing) {
          existing.quantity += 1
        } else {
          map.set(item.id, { ...item, quantity: 1 })
        }
      }
      setItems(Array.from(map.values()))
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => { loadCart() }, [loadCart])

  const saveCart = (updated: CartItem[]) => {
    // Flatten back to individual items for localStorage (matching products page format)
    const flat: { id: string; name: string; price: number; image_url: string | null }[] = []
    for (const item of updated) {
      for (let i = 0; i < item.quantity; i++) {
        flat.push({ id: item.id, name: item.name, price: item.price, image_url: item.image_url })
      }
    }
    localStorage.setItem("midnight_cart", JSON.stringify(flat))
    setItems(updated)
  }

  const updateQuantity = (id: string, delta: number) => {
    const updated = items.map(item => {
      if (item.id !== id) return item
      const newQty = item.quantity + delta
      return newQty > 0 ? { ...item, quantity: newQty } : item
    }).filter(item => item.quantity > 0)
    saveCart(updated)
  }

  const removeItem = (id: string) => {
    saveCart(items.filter(item => item.id !== id))
  }

  const clearCart = () => {
    localStorage.removeItem("midnight_cart")
    setItems([])
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError(null)

    try {
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), order_total: subtotal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid coupon")

      setAppliedCoupon({
        code: data.code,
        description: data.description,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        discount_amount: data.discount_amount,
      })
      setCouponCode("")
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Invalid coupon")
      setAppliedCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponError(null)
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = appliedCoupon ? appliedCoupon.discount_amount : 0
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const checkout = async () => {
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    // Check if user is logged in
    const userStr = localStorage.getItem("salon_user")
    if (!userStr) {
      router.push("/login?redirectTo=/cart")
      return
    }

    try {
      const res = await fetch("/api/orders/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
          notes: notes || undefined,
          coupon_code: appliedCoupon?.code || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Order failed")

      // Clear cart on success
      localStorage.removeItem("midnight_cart")
      setItems([])
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen pt-20 flex items-center justify-center px-4">
        <GeometricBg variant="default" />
        <div className="relative text-center max-w-md">
          <div className="w-20 h-20 rounded-full gradient-accent mx-auto mb-6 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>Order Placed</h1>
          <p className="text-sm mb-8" style={{ color: "hsl(var(--text-secondary))" }}>
            Your order has been submitted. We&apos;ll notify you when it&apos;s confirmed.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/products" className="btn-primary text-sm">Continue Shopping</Link>
            <Link
              href="/profile"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" }}
            >
              My Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pt-20 pb-16">
      <GeometricBg variant="default" />

      <div className="relative max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Your Cart</h1>
            <p className="mt-1 text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
              {itemCount === 0 ? "Your cart is empty" : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: "var(--accent-hex)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4" /></svg>
            Shop
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5" className="mx-auto mb-4">
              <path d="M12 16h28l-3 16H15z" />
              <path d="M12 16L10 8H4" />
              <circle cx="18" cy="40" r="3" />
              <circle cx="34" cy="40" r="3" />
            </svg>
            <p className="text-sm mb-4" style={{ color: "hsl(var(--text-muted))" }}>Nothing here yet</p>
            <Link href="/products" className="btn-primary text-sm inline-block">Browse Products</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            {items.map((item) => (
              <div key={item.id} className="card-glass p-4 flex gap-4 items-center animate-fade-in">
                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--surface-2-hex)" }}>
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 32 32" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5">
                        <rect x="6" y="8" width="20" height="18" rx="3" />
                        <path d="M10 8V6a6 6 0 0112 0v2" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate" style={{ color: "hsl(var(--text-primary))" }}>{item.name}</h3>
                  <p className="text-sm font-bold mt-0.5" style={{ color: "var(--accent-hex)" }}>&pound;{item.price}</p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="hsl(var(--text-primary))" strokeWidth="1.5"><path d="M3 6h6" /></svg>
                  </button>
                  <span className="w-8 text-center text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="hsl(var(--text-primary))" strokeWidth="1.5"><path d="M6 3v6M3 6h6" /></svg>
                  </button>
                </div>

                {/* Line total + remove */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>
                    &pound;{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[10px] mt-1 transition-opacity hover:opacity-80"
                    style={{ color: "hsl(var(--text-muted))" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {/* Notes */}
            <div className="card-glass p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>
                Order Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
              />
            </div>

            {/* Coupon Code */}
            <div className="card-glass p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>
                Coupon Code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M13 5L6.5 11.5 3 8" /></svg>
                    <div>
                      <span className="text-sm font-bold" style={{ color: "#22c55e" }}>{appliedCoupon.code}</span>
                      <span className="text-xs ml-2" style={{ color: "hsl(var(--text-secondary))" }}>
                        {appliedCoupon.discount_type === "percentage"
                          ? `${appliedCoupon.discount_value}% off`
                          : `£${appliedCoupon.discount_value} off`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
                    style={{ color: "hsl(var(--text-muted))" }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null) }}
                    placeholder="Enter code e.g. WELCOME10"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none uppercase tracking-wider font-mono"
                    style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: `1px solid ${couponError ? "rgba(239,68,68,0.5)" : "var(--glass-border)"}` }}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--accent-hex)" }}
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{couponError}</p>
              )}
            </div>

            {/* Summary */}
            <div className="card-glass p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>Subtotal ({itemCount} items)</span>
                <span className="text-sm font-bold" style={{ color: "hsl(var(--text-primary))" }}>&pound;{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: "#22c55e" }}>Discount ({appliedCoupon.code})</span>
                  <span className="text-sm font-bold" style={{ color: "#22c55e" }}>&minus;&pound;{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <span className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>Collection</span>
                <span className="text-sm font-bold" style={{ color: "#22c55e" }}>Free</span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold" style={{ color: "hsl(var(--text-primary))" }}>Total</span>
                <span className="text-2xl font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{total.toFixed(2)}</span>
              </div>

              {error && (
                <p className="text-sm p-3 rounded-lg mb-4" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </p>
              )}

              <button
                onClick={checkout}
                disabled={loading || items.length === 0}
                className="btn-primary w-full text-center disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10" /></svg>
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>

              <button
                onClick={clearCart}
                className="w-full text-center text-xs mt-3 py-2 transition-opacity hover:opacity-80"
                style={{ color: "hsl(var(--text-muted))" }}
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
