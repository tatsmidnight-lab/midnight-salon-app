"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Service = {
  id: string; name: string; base_price: number; duration: number
  artist_id: string; category_id: string; category_name?: string
  image_url: string | null; is_active: boolean; description?: string
}
type Artist = { id: string; name: string }
type Category = { id: string; name: string }

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [editService, setEditService] = useState<Service | null>(null)
  const [editForm, setEditForm] = useState({ name: "", base_price: "", duration: "", category_id: "", is_active: true })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())

  // Bulk AI
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState("")
  const [bulkCategory, setBulkCategory] = useState("")
  const [bulkCount, setBulkCount] = useState("5")
  const [bulkStyle, setBulkStyle] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then((r) => r.ok ? r.json() : []),
      fetch("/api/artists").then((r) => r.ok ? r.json() : []),
      fetch("/api/services/get-categories").then((r) => r.ok ? r.json() : []),
    ]).then(([svcs, arts, cats]) => {
      setServices(Array.isArray(svcs) ? svcs : [])
      setArtists(Array.isArray(arts) ? arts : [])
      setCategories(Array.isArray(cats) ? cats : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const openEdit = (svc: Service) => {
    setEditService(svc)
    setEditForm({
      name: svc.name,
      base_price: String(svc.base_price),
      duration: String(svc.duration),
      category_id: svc.category_id || "",
      is_active: svc.is_active !== false,
    })
  }

  const saveEdit = async () => {
    if (!editService) return
    setSaving(true)
    try {
      const res = await fetch("/api/services/admin-update-service", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: editService.id,
          name: editForm.name,
          base_price: Number(editForm.base_price),
          duration: Number(editForm.duration),
          category_id: editForm.category_id || undefined,
          is_active: editForm.is_active,
        }),
      })
      if (res.ok) {
        setServices((prev) => prev.map((s) => s.id === editService.id ? {
          ...s, name: editForm.name, base_price: Number(editForm.base_price),
          duration: Number(editForm.duration), category_id: editForm.category_id,
          is_active: editForm.is_active,
        } : s))
        setEditService(null)
        showToast("Service updated")
      }
    } catch {} finally { setSaving(false) }
  }

  const deleteService = async (id: string) => {
    try {
      await fetch("/api/services/admin-delete-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: id }),
      })
      setServices((prev) => prev.filter((s) => s.id !== id))
      showToast("Service deleted")
    } catch {}
  }

  const bulkDelete = async () => {
    const promises = Array.from(selectedServices).map((id) =>
      fetch("/api/services/admin-delete-service", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: id }),
      })
    )
    await Promise.all(promises)
    setServices((prev) => prev.filter((s) => !selectedServices.has(s.id)))
    showToast(`${selectedServices.size} services deleted`)
    setSelectedServices(new Set())
  }

  const handleBulkCreate = async () => {
    if (!bulkText.trim()) return
    setBulkLoading(true)
    try {
      const res = await fetch("/api/services/admin-bulk-create-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: bulkText,
          category_id: bulkCategory || undefined,
          count: Number(bulkCount) || 5,
          style: bulkStyle || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.services) setServices((prev) => [...prev, ...data.services])
        setBulkText("")
        setShowBulk(false)
        showToast(`${data.services?.length || 0} services created`)
      }
    } catch {} finally { setBulkLoading(false) }
  }

  const getCatName = (catId: string) => categories.find((c) => c.id === catId)?.name || "—"
  const getArtistName = (artId: string) => artists.find((a) => a.id === artId)?.name || "—"

  const filtered = services.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === "all" || s.category_id === catFilter
    return matchSearch && matchCat
  })

  const toggleSelect = (id: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>{toast}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Services</h1>
          <p className="mt-1" style={{ color: "hsl(var(--text-secondary))" }}>Manage all services across artists</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(!showBulk)} className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2v12M2 8h12"/></svg>
            Bulk AI Create
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card-glass p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--accent-hex)" }}>{loading ? "—" : services.length}</p>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Total Services</p>
        </div>
        <div className="card-glass p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: "#22c55e" }}>{loading ? "—" : services.filter(s => s.is_active !== false).length}</p>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Active</p>
        </div>
        <div className="card-glass p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: "#8b5cf6" }}>{loading ? "—" : categories.length}</p>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Categories</p>
        </div>
        <div className="card-glass p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--accent-2-hex)" }}>{loading ? "—" : artists.length}</p>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Artists</p>
        </div>
      </div>

      {/* Bulk AI Create Panel */}
      {showBulk && (
        <div className="card-glass p-6 mb-6 animate-page-enter" style={{ borderColor: "var(--accent-hex)", borderWidth: "1px" }}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--text-primary))" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M6 8h4M8 6v4"/></svg>
            Bulk AI Service Creator
          </h3>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}>
              <option value="">Any category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} placeholder="Count" min={1} max={20} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
            <input value={bulkStyle} onChange={(e) => setBulkStyle(e.target.value)} placeholder="Style (e.g. Japanese, Minimalist)" className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
          </div>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Describe the services you want to create... e.g. 'Traditional Japanese half sleeve with koi fish and waves, including consultation and aftercare'" rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
          <div className="flex gap-2">
            <button onClick={handleBulkCreate} disabled={bulkLoading || !bulkText.trim()} className="btn-primary text-sm disabled:opacity-50">
              {bulkLoading ? "Generating..." : "Generate with AI"}
            </button>
            <button onClick={() => setShowBulk(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..." className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCatFilter("all")} className={`px-3 py-2 rounded-full text-xs font-semibold transition-all ${catFilter === "all" ? "gradient-accent text-white" : ""}`} style={catFilter !== "all" ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}>All</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCatFilter(c.id)} className={`px-3 py-2 rounded-full text-xs font-semibold transition-all ${catFilter === c.id ? "gradient-accent text-white" : ""}`} style={catFilter !== c.id ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}>{c.name}</button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedServices.size > 0 && (
        <div className="card-glass p-3 mb-4 flex items-center gap-3 animate-fade-in">
          <span className="text-xs font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{selectedServices.size} selected</span>
          <button onClick={bulkDelete} className="text-xs font-semibold text-red-400 hover:text-red-300">Delete Selected</button>
          <button onClick={() => setSelectedServices(new Set())} className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={filtered.length > 0 && selectedServices.size === filtered.length} onChange={() => {
                    if (selectedServices.size === filtered.length) setSelectedServices(new Set())
                    else setSelectedServices(new Set(filtered.map(s => s.id)))
                  }} style={{ accentColor: "var(--accent-hex)" }} />
                </th>
                {["Service", "Category", "Price", "Duration", "Artist", "Image", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td colSpan={8} className="px-4 py-4"><div className="h-4 rounded animate-pulse" style={{ background: "var(--surface-2-hex)", width: `${50 + Math.random() * 40}%` }} /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: "hsl(var(--text-muted))" }}>{search ? "No services match" : "No services"}</td></tr>
              ) : (
                filtered.map((svc) => (
                  <tr key={svc.id} className="group transition-colors" style={{ borderBottom: "1px solid var(--glass-border)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--glass-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedServices.has(svc.id)} onChange={() => toggleSelect(svc.id)} style={{ accentColor: "var(--accent-hex)" }} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dash-admin/services/${svc.id}`} className="font-semibold hover:underline" style={{ color: "hsl(var(--text-primary))" }}>{svc.name}</Link>
                      {svc.is_active === false && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--glass-bg)", color: "hsl(var(--text-secondary))", border: "1px solid var(--glass-border)" }}>{getCatName(svc.category_id)}</span>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{svc.base_price}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(var(--text-secondary))" }}>{svc.duration}min</td>
                    <td className="px-4 py-3" style={{ color: "hsl(var(--text-secondary))" }}>{getArtistName(svc.artist_id)}</td>
                    <td className="px-4 py-3">
                      {svc.image_url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden" style={{ background: "var(--surface-2-hex)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={svc.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--surface-2-hex)" }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><circle cx="6" cy="6" r="1.5"/><path d="M2 11l3-3 2 2 4-4 3 3"/></svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(svc)} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }} title="Quick edit">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-secondary))" strokeWidth="1.5" strokeLinecap="round"><path d="M11.5 1.5l3 3L5 14H2v-3z"/></svg>
                        </button>
                        <Link href={`/dash-admin/services/${svc.id}`} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }} title="Full detail">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-secondary))" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8s3-5 6-5 6 5 6 5-3 5-6 5-6-5-6-5z"/><circle cx="8" cy="8" r="2"/></svg>
                        </Link>
                        <button onClick={() => deleteService(svc.id)} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }} title="Delete">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {editService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditService(null)} />
          <div className="relative w-full max-w-md card-glass p-6 animate-scale-in" style={{ background: "var(--surface-hex)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-primary))" }}>Quick Edit</h2>
              <button onClick={() => setEditService(null)} className="p-1" style={{ color: "hsl(var(--text-muted))" }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Service Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Category</label>
                <select value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}>
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Price (&pound;)</label>
                  <input type="number" value={editForm.base_price} onChange={(e) => setEditForm({ ...editForm, base_price: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Duration (min)</label>
                  <input type="number" value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-xs font-semibold" style={{ color: "hsl(var(--text-secondary))" }}>Active</label>
                <button onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })} className="w-12 h-6 rounded-full transition-all relative" style={{ background: editForm.is_active ? "#22c55e" : "var(--surface-2-hex)", border: "1px solid var(--glass-border)" }}>
                  <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: editForm.is_active ? "calc(100% - 22px)" : "2px" }} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditService(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 text-sm disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
