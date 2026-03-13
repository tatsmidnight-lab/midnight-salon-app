"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const NAV_ITEMS = [
  { href: "/dash-admin", label: "Overview", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="7" height="7" rx="1"/><rect x="10" y="1" width="7" height="7" rx="1"/><rect x="1" y="10" width="7" height="7" rx="1"/><rect x="10" y="10" width="7" height="7" rx="1"/></svg> },
  { href: "/dash-admin/users", label: "Users", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="6" r="4"/><path d="M2 18c0-4 3-7 7-7s7 3 7 7"/></svg> },
  { href: "/dash-admin/services", label: "Services", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M9 11v4M6 17h6"/></svg> },
  { href: "/dash-admin/products", label: "Products", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="5" width="12" height="10" rx="2"/><path d="M6 5V3a3 3 0 016 0v2"/></svg> },
  { href: "/dash-admin/orders", label: "Orders", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3h12l-1 9H4z"/><circle cx="6" cy="15" r="1.5"/><circle cx="14" cy="15" r="1.5"/></svg> },
  { href: "/dash-admin/packages", label: "Packages", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="14" height="10" rx="2"/><path d="M2 9h14M9 5v10"/></svg> },
  { href: "/dash-admin/bulk-sms", label: "Bulk SMS", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3h12a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3V5a2 2 0 012-2z"/></svg> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("midnight_admin_token")
    if (token) setAuthed(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      })
      if (res.ok) {
        localStorage.setItem("midnight_admin_token", "true")
        setAuthed(true)
      } else {
        setLoginError("Invalid credentials")
      }
    } catch {
      setLoginError("Login failed")
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-hex)" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="" className="w-14 h-14 rounded-full mx-auto mb-4" />
            <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Admin</h1>
          </div>
          <form onSubmit={handleLogin} className="card-glass p-8 space-y-4">
            <input value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} placeholder="Username" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
            <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Password" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <button type="submit" className="btn-primary w-full text-center">Sign In</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-hex)" }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 fixed inset-y-0 left-0 z-30" style={{ background: "var(--surface-hex)", borderRight: "1px solid var(--glass-border)" }}>
        <div className="h-14 flex items-center px-5" style={{ borderBottom: "1px solid var(--glass-border)" }}>
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="" className="w-7 h-7 rounded-full" />
            <span className="font-bold text-sm" style={{ color: "hsl(var(--text-primary))" }}>Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dash-admin" && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? "gradient-accent text-white" : ""}`} style={!active ? { color: "hsl(var(--text-secondary))" } : undefined}>
                {item.icon}{item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3" style={{ borderTop: "1px solid var(--glass-border)" }}>
          <button onClick={() => { localStorage.removeItem("midnight_admin_token"); router.push("/") }} className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Sign Out</button>
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4" style={{ background: "var(--surface-hex)", borderBottom: "1px solid var(--glass-border)" }}>
        <span className="font-bold text-sm" style={{ color: "hsl(var(--text-primary))" }}>Admin</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: "hsl(var(--text-primary))" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>
        </button>
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-60 animate-slide-right" style={{ background: "var(--surface-hex)" }}>
            <nav className="p-3 pt-16 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href
                return <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${active ? "gradient-accent text-white" : ""}`} style={!active ? { color: "hsl(var(--text-secondary))" } : undefined}>{item.icon}{item.label}</Link>
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">{children}</div>
    </div>
  )
}
