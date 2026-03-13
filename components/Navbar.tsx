"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ThemeToggle from "./ThemeToggle"

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<{ display_name?: string; role?: string } | null>(null)

  const isHome = pathname === "/"
  const isArtist = pathname.startsWith("/artist")
  const isAdmin = pathname.startsWith("/dash-admin")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("salon_user")
      if (raw) setUser(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Hide navbar on artist/admin dashboards (they have their own sidebar)
  if (isArtist || isAdmin) return null

  const navLinks = [
    { href: "/services", label: "Services" },
    { href: "/products", label: "Products" },
    { href: "/gift-cards", label: "Gift Cards" },
    { href: "/contact", label: "Contact" },
  ]

  const showTransparent = isHome && !scrolled

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showTransparent
            ? "bg-transparent"
            : "glass-strong shadow-lg"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 z-10" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Midnight" className="w-9 h-9 rounded-full" />
            <span className="font-bold text-lg tracking-tight" style={{ color: "hsl(var(--text-primary))" }}>
              Midnight
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3 z-10">
            <ThemeToggle />

            {/* Hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="relative w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ color: "hsl(var(--text-primary))" }}
              aria-label="Menu"
            >
              <div className="w-5 flex flex-col gap-[5px]">
                <span
                  className={`block h-[2px] rounded-full transition-all duration-300 ${
                    open ? "rotate-45 translate-y-[7px]" : ""
                  }`}
                  style={{ backgroundColor: "hsl(var(--text-primary))" }}
                />
                <span
                  className={`block h-[2px] rounded-full transition-all duration-300 ${
                    open ? "opacity-0 scale-0" : ""
                  }`}
                  style={{ backgroundColor: "hsl(var(--text-primary))" }}
                />
                <span
                  className={`block h-[2px] rounded-full transition-all duration-300 ${
                    open ? "-rotate-45 -translate-y-[7px]" : ""
                  }`}
                  style={{ backgroundColor: "hsl(var(--text-primary))" }}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Full-screen drawer menu */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "var(--bg-hex)" }}
      >
        <div className="h-full flex flex-col pt-20 px-8 sm:px-16 overflow-y-auto">
          {/* Nav links */}
          <div className="flex-1 flex flex-col justify-center -mt-12">
            <div className="space-y-1">
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block py-3 text-4xl sm:text-5xl font-bold tracking-tight transition-all duration-300 hover:translate-x-3 ${
                    open ? "animate-fade-up" : ""
                  }`}
                  style={{
                    color: pathname === link.href ? "var(--accent-hex)" : "hsl(var(--text-primary))",
                    animationDelay: `${i * 0.07}s`,
                  }}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 border-t" style={{ borderColor: "var(--glass-border)" }}>
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="block py-3 text-2xl font-semibold transition-all duration-300 hover:translate-x-3"
                      style={{ color: "hsl(var(--text-secondary))" }}
                    >
                      View Profile
                    </Link>
                    {(user.role === "artist" || user.role === "admin") && (
                      <Link
                        href="/artist"
                        onClick={() => setOpen(false)}
                        className="block py-3 text-2xl font-semibold transition-all duration-300 hover:translate-x-3"
                        style={{ color: "hsl(var(--text-secondary))" }}
                      >
                        Artist Dashboard
                      </Link>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block py-3 text-2xl font-semibold transition-all duration-300 hover:translate-x-3"
                    style={{ color: "hsl(var(--text-secondary))" }}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pb-8 space-y-4">
            <div className="flex items-center gap-6">
              <a
                href="https://www.instagram.com/midnight.tats/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: "hsl(var(--text-secondary))" }}
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@midnight.tats"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: "hsl(var(--text-secondary))" }}
              >
                TikTok
              </a>
              <a
                href="tel:+447958747929"
                className="text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: "hsl(var(--text-secondary))" }}
              >
                Phone
              </a>
            </div>
            <Link
              href="/terms"
              onClick={() => setOpen(false)}
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: "hsl(var(--text-muted))" }}
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
