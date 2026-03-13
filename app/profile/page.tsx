"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import GeometricBg from "@/components/GeometricBg"

type User = { id: string; display_name: string; email: string; phone: string; role: string }
type Booking = { id: string; date: string; time: string; status: string; services?: { name: string } }
type Order = { id: string; created_at: string; total: number; status: string }

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<"bookings" | "orders" | "messages">("bookings")
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: "", email: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) { router.push("/login?redirectTo=/profile"); return }
        const data = await res.json()
        setUser(data)
        setForm({ display_name: data.display_name || "", email: data.email || "" })

        // Fetch bookings & orders
        const [bRes, oRes] = await Promise.all([
          fetch("/api/bookings/get-customer-bookings"),
          fetch("/api/orders/get-customer-orders"),
        ])
        if (bRes.ok) { const b = await bRes.json(); setBookings(Array.isArray(b) ? b : []) }
        if (oRes.ok) { const o = await oRes.json(); setOrders(Array.isArray(o) ? o : []) }
      } catch {}
      setLoading(false)
    }
    fetchProfile()
  }, [router])

  const handleSave = async () => {
    try {
      await fetch("/api/customer/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setUser((u) => u ? { ...u, ...form } : u)
      setEditing(false)
    } catch {}
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    localStorage.removeItem("salon_user")
    router.push("/")
  }

  const statusColor = (s: string) => {
    if (s === "confirmed" || s === "completed" || s === "delivered") return "#22c55e"
    if (s === "pending" || s === "processing") return "var(--accent-hex)"
    if (s === "cancelled") return "#ef4444"
    return "hsl(var(--text-muted))"
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="" className="w-12 h-12 rounded-full animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4">
        <p className="mb-4" style={{ color: "hsl(var(--text-muted))" }}>Unable to load your profile</p>
        <button onClick={() => router.push("/login?redirectTo=/profile")} className="btn-primary text-sm">
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pt-20 pb-16">
      <GeometricBg variant="default" />

      <div className="relative max-w-3xl mx-auto px-4">
        {/* Profile header */}
        <div className="card-glass p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-white text-xl font-bold">
              {(user.display_name || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                  />
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email"
                    type="email"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="btn-primary !py-2 !px-4 text-xs">Save</button>
                    <button onClick={() => setEditing(false)} className="text-xs" style={{ color: "hsl(var(--text-secondary))" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>{user.display_name || "User"}</h2>
                  <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>{user.phone}</p>
                  {user.email && <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>{user.email}</p>}
                </>
              )}
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-sm font-semibold" style={{ color: "var(--accent-hex)" }}>Edit</button>
            )}
          </div>
          <button onClick={handleLogout} className="text-sm hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-muted))" }}>
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          {(["bookings", "orders", "messages"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                tab === t ? "gradient-accent text-white" : ""
              }`}
              style={tab !== t ? { color: "hsl(var(--text-secondary))" } : undefined}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "bookings" && (
          <div className="space-y-3 animate-page-enter">
            {bookings.length === 0 ? (
              <div className="card-glass p-12 text-center">
                <p style={{ color: "hsl(var(--text-muted))" }}>No bookings yet</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="card-glass p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{b.services?.name || "Service"}</p>
                    <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
                      {new Date(b.date + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at {b.time}
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase px-3 py-1 rounded-full" style={{ color: statusColor(b.status), background: `${statusColor(b.status)}15`, border: `1px solid ${statusColor(b.status)}30` }}>
                    {b.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3 animate-page-enter">
            {orders.length === 0 ? (
              <div className="card-glass p-12 text-center">
                <p style={{ color: "hsl(var(--text-muted))" }}>No orders yet</p>
              </div>
            ) : (
              orders.map((o) => (
                <button key={o.id} onClick={() => router.push(`/orders/${o.id}`)} className="card-glass p-4 flex items-center justify-between w-full text-left">
                  <div>
                    <p className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>Order #{o.id.slice(0, 8)}</p>
                    <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
                      {new Date(o.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{o.total}</p>
                    <span className="text-xs font-bold uppercase" style={{ color: statusColor(o.status) }}>{o.status}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === "messages" && (
          <div className="card-glass p-12 text-center animate-page-enter">
            <p style={{ color: "hsl(var(--text-muted))" }}>Messages coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
