"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Stats = {
  totalBookings: number
  upcoming: number
  services: number
  earnings: number
}

type Booking = {
  id: string; date: string; time: string; status: string
  services?: { name: string; price: number }
  customer_name?: string
}

export default function ArtistOverviewPage() {
  const [stats, setStats] = useState<Stats>({ totalBookings: 0, upcoming: 0, services: 0, earnings: 0 })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) return
        const me = await res.json()

        const artistId = me.artist_profile?.id
        if (!artistId) return

        const [bRes] = await Promise.all([
          fetch(`/api/bookings/get-artist-bookings?date=${new Date().toISOString().split("T")[0]}`),
        ])

        if (bRes.ok) {
          const bookings = await bRes.json()
          const bArr = Array.isArray(bookings) ? bookings : []
          setRecentBookings(bArr.slice(0, 5))

          const now = new Date()
          const upcoming = bArr.filter((b: Booking) =>
            b.status === "confirmed" && new Date(`${b.date}T${b.time}`) > now
          ).length

          const completed = bArr.filter((b: Booking) => b.status === "completed")
          const earnings = completed.reduce((sum: number, b: Booking) => sum + (b.services?.price || 0), 0)

          setStats({
            totalBookings: bArr.length,
            upcoming,
            services: 0,
            earnings,
          })
        }
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [])

  const statCards = [
    { label: "Total Bookings", value: stats.totalBookings, color: "var(--accent-hex)" },
    { label: "Upcoming", value: stats.upcoming, color: "#3b82f6" },
    { label: "Earnings", value: `£${stats.earnings}`, color: "#22c55e" },
  ]

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>Dashboard</h1>
      <p className="mb-8" style={{ color: "hsl(var(--text-secondary))" }}>Welcome back! Here&apos;s your overview.</p>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className="card-glass p-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-muted))" }}>{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>
              {loading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <Link href="/artist/calendar" className="card-glass p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <rect x="2" y="4" width="16" height="14" rx="2" /><path d="M2 8h16M6 2v4M14 2v4" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold" style={{ color: "hsl(var(--text-primary))" }}>Calendar</h3>
            <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>Manage your schedule</p>
          </div>
        </Link>
        <Link href="/artist/services" className="card-glass p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="10" cy="8" r="4" /><path d="M10 12v4M7 18h6" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold" style={{ color: "hsl(var(--text-primary))" }}>Services</h3>
            <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>Add or edit services</p>
          </div>
        </Link>
      </div>

      {/* Recent bookings */}
      <h2 className="text-xl font-bold mb-4" style={{ color: "hsl(var(--text-primary))" }}>Today&apos;s Bookings</h2>
      <div className="card-glass overflow-hidden">
        {loading ? (
          <div className="p-6 text-center animate-pulse" style={{ color: "hsl(var(--text-muted))" }}>Loading...</div>
        ) : recentBookings.length === 0 ? (
          <div className="p-12 text-center">
            <p style={{ color: "hsl(var(--text-muted))" }}>No bookings today</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--glass-border)" }}>
            {recentBookings.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{b.services?.name || "Service"}</p>
                  <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>{b.time}</p>
                </div>
                <span
                  className="text-xs font-bold uppercase px-3 py-1 rounded-full"
                  style={{
                    color: b.status === "confirmed" ? "#22c55e" : "var(--accent-hex)",
                    background: b.status === "confirmed" ? "rgba(34,197,94,0.1)" : "rgba(255,0,110,0.1)",
                  }}
                >
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
