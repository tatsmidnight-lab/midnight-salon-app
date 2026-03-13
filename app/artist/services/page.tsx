"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Service = {
  id: string; name: string; description: string; base_price: number
  duration: number; image_url: string | null; is_active: boolean
}

export default function ArtistServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const meRes = await fetch("/api/auth/me")
        if (!meRes.ok) return
        const me = await meRes.json()
        const artistId = me.artist_profile?.id
        if (!artistId) return

        const res = await fetch(`/api/artists/${artistId}`)
        if (res.ok) {
          const data = await res.json()
          setServices(data.services || [])
        }
      } catch {}
      setLoading(false)
    }
    fetchServices()
  }, [])

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Services</h1>
          <p className="mt-1" style={{ color: "hsl(var(--text-secondary))" }}>Manage your service offerings</p>
        </div>
        <Link href="/artist/services/new" className="btn-primary flex items-center gap-2 text-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>
          Add Service
        </Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-glass p-5 animate-pulse">
              <div className="h-4 w-2/3 rounded mb-3" style={{ background: "var(--surface-2-hex)" }} />
              <div className="h-3 w-1/2 rounded" style={{ background: "var(--surface-2-hex)" }} />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="card-glass p-16 text-center">
          <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 48 48" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="24" cy="18" r="8" /><path d="M24 26v10M18 42h12" />
          </svg>
          <p className="mb-4" style={{ color: "hsl(var(--text-muted))" }}>No services yet</p>
          <Link href="/artist/services/new" className="btn-primary inline-block px-8">
            Create Your First Service
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 stagger-children">
          {services.map((svc) => (
            <div key={svc.id} className="card-glass p-5 flex gap-4">
              {svc.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={svc.image_url} alt={svc.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "var(--surface-2-hex)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M12 12v6"/></svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate" style={{ color: "hsl(var(--text-primary))" }}>{svc.name}</h3>
                <p className="text-sm line-clamp-1 mt-0.5" style={{ color: "hsl(var(--text-secondary))" }}>{svc.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{svc.base_price}</span>
                  <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{svc.duration}min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
