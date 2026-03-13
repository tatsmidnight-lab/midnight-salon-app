"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ users: 0, artists: 0, services: 0, orders: 0, bookings: 0 })
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  useEffect(() => {
    // Quick counts from various endpoints
    Promise.all([
      fetch("/api/admin/users").then(r => r.ok ? r.json() : []),
      fetch("/api/artists").then(r => r.ok ? r.json() : []),
      fetch("/api/services").then(r => r.ok ? r.json() : []),
    ]).then(([users, artists, services]) => {
      setStats({
        users: Array.isArray(users) ? users.length : 0,
        artists: Array.isArray(artists) ? artists.length : 0,
        services: Array.isArray(services) ? services.length : 0,
        orders: 0,
        bookings: 0,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: "Users", value: stats.users, href: "/dash-admin/users", color: "var(--accent-hex)" },
    { label: "Artists", value: stats.artists, href: "/dash-admin/users", color: "#8b5cf6" },
    { label: "Services", value: stats.services, href: "/dash-admin/services", color: "#3b82f6" },
    { label: "Orders", value: stats.orders, href: "/dash-admin/orders", color: "#22c55e" },
  ]

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>Admin Dashboard</h1>
      <p className="mb-8" style={{ color: "hsl(var(--text-secondary))" }}>Overview of your studio</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card-glass p-6 group">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-muted))" }}>{c.label}</p>
            <p className="text-3xl font-bold" style={{ color: c.color }}>{loading ? "—" : c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: "Manage Users", desc: "View, edit roles, deactivate", href: "/dash-admin/users" },
          { label: "Manage Services", desc: "Create, assign, bulk upload", href: "/dash-admin/services" },
          { label: "Manage Products", desc: "CRUD, stock, categories", href: "/dash-admin/products" },
          { label: "Send Bulk SMS", desc: "Templates, filters, send", href: "/dash-admin/bulk-sms" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="card-glass p-6 group">
            <h3 className="font-bold mb-1" style={{ color: "hsl(var(--text-primary))" }}>{item.label}</h3>
            <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Seed Data */}
      <div className="card-glass p-6 mt-8">
        <h3 className="font-bold mb-1" style={{ color: "hsl(var(--text-primary))" }}>Seed Sample Data</h3>
        <p className="text-sm mb-4" style={{ color: "hsl(var(--text-secondary))" }}>
          Populate categories, services and products with sample data (safe to run multiple times)
        </p>
        <button
          onClick={async () => {
            setSeeding(true)
            setSeedResult(null)
            try {
              const key = prompt("Enter the last 8 characters of your Supabase service role key:")
              if (!key) { setSeeding(false); return }
              const res = await fetch(`/api/seed?key=${key}`, { method: "POST" })
              const data = await res.json()
              setSeedResult(res.ok ? `Done: ${data.results?.join(", ")}` : `Error: ${data.error}`)
            } catch (err) {
              setSeedResult(`Error: ${String(err)}`)
            } finally { setSeeding(false) }
          }}
          disabled={seeding}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {seeding ? "Seeding..." : "Seed Data"}
        </button>
        {seedResult && (
          <p className="text-sm mt-3" style={{ color: seedResult.startsWith("Error") ? "#ef4444" : "#22c55e" }}>
            {seedResult}
          </p>
        )}
      </div>
    </div>
  )
}
