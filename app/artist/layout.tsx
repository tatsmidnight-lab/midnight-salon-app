"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const NAV_ITEMS = [
  {
    href: "/artist",
    label: "Overview",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="2" width="7" height="7" rx="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/artist/calendar",
    label: "Calendar",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="4" width="16" height="14" rx="2" />
        <path d="M2 8h16M6 2v4M14 2v4" />
      </svg>
    ),
  },
  {
    href: "/artist/services",
    label: "Services",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="8" r="4" />
        <path d="M10 12v4M7 18h6" />
      </svg>
    ),
  },
  {
    href: "/artist/orders",
    label: "Orders",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="5" width="14" height="12" rx="2" />
        <path d="M7 5V3a3 3 0 016 0v2M8 10h4" />
      </svg>
    ),
  },
  {
    href: "/artist/messages",
    label: "Messages",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 4h12a2 2 0 012 2v7a2 2 0 01-2 2H7l-3 3V6a2 2 0 012-2z" />
      </svg>
    ),
  },
]

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ display_name?: string; role?: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("salon_user")
      if (raw) setUser(JSON.parse(raw))
    } catch {}
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    localStorage.removeItem("salon_user")
    router.push("/")
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-hex)" }}>
      {/* Sidebar — desktop */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30"
        style={{ background: "var(--surface-hex)", borderRight: "1px solid var(--glass-border)" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6" style={{ borderBottom: "1px solid var(--glass-border)" }}>
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-sm" style={{ color: "hsl(var(--text-primary))" }}>Midnight</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/artist" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "gradient-accent text-white shadow-lg" : ""
                }`}
                style={!isActive ? { color: "hsl(var(--text-secondary))" } : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User card */}
        <div className="p-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold">
              {(user?.display_name || "A")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--text-primary))" }}>
                {user?.display_name || "Artist"}
              </p>
              <p className="text-xs capitalize" style={{ color: "hsl(var(--text-muted))" }}>{user?.role || "artist"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-muted))" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4" style={{ background: "var(--surface-hex)", borderBottom: "1px solid var(--glass-border)" }}>
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="" className="w-7 h-7 rounded-full" />
          <span className="font-bold text-sm" style={{ color: "hsl(var(--text-primary))" }}>Midnight</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ color: "hsl(var(--text-primary))" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 animate-slide-right" style={{ background: "var(--surface-hex)" }}>
            <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: "1px solid var(--glass-border)" }}>
              <span className="font-bold text-sm" style={{ color: "hsl(var(--text-primary))" }}>Menu</span>
              <button onClick={() => setSidebarOpen(false)} style={{ color: "hsl(var(--text-secondary))" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/artist" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "gradient-accent text-white" : ""}`}
                    style={!isActive ? { color: "hsl(var(--text-secondary))" } : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <div className="pt-14 lg:pt-0 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  )
}
