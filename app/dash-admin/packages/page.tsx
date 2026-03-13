"use client"

import { useEffect, useState } from "react"

type Service = { id: string; name: string; base_price: number; duration: number; category_id: string }
type Product = { id: string; name: string; price: number; category: string }
type Artist = { id: string; name: string }
type Package = {
  id: string; name: string; description: string; discount_percent: number
  price: number; artist_id?: string; image_url?: string
  services?: PkgService[]; products?: PkgProduct[]
}
type PkgService = { service_id: string; quantity: number; include_free: boolean }
type PkgProduct = { product_id: string; quantity: number; include_free: boolean }

const INITIAL_FORM = {
  name: "", description: "", artist_id: "", discount_percent: "10", price: "",
  services: [] as PkgService[], products: [] as PkgProduct[],
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // AI suggestions
  const [aiFocus, setAiFocus] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ name: string; description: string; services: string[]; products: string[]; discount: number }>>([])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    Promise.all([
      fetch("/api/services/get-packages").then((r) => r.ok ? r.json() : []),
      fetch("/api/services").then((r) => r.ok ? r.json() : []),
      fetch("/api/products/get-all-products").then((r) => r.ok ? r.json() : []),
      fetch("/api/artists").then((r) => r.ok ? r.json() : []),
    ]).then(([pkgs, svcs, prods, arts]) => {
      setPackages(Array.isArray(pkgs) ? pkgs : [])
      setAllServices(Array.isArray(svcs) ? svcs : [])
      setAllProducts(Array.isArray(prods) ? prods.filter((p: Product) => p.category !== "gift_card") : [])
      setArtists(Array.isArray(arts) ? arts : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const calcPrice = () => {
    let total = 0
    form.services.forEach((ps) => {
      if (!ps.include_free) {
        const svc = allServices.find((s) => s.id === ps.service_id)
        if (svc) total += svc.base_price * ps.quantity
      }
    })
    form.products.forEach((pp) => {
      if (!pp.include_free) {
        const prod = allProducts.find((p) => p.id === pp.product_id)
        if (prod) total += prod.price * pp.quantity
      }
    })
    const discount = Number(form.discount_percent) || 0
    return Math.round(total * (1 - discount / 100) * 100) / 100
  }

  const toggleService = (serviceId: string) => {
    setForm((prev) => {
      const exists = prev.services.find((s) => s.service_id === serviceId)
      return {
        ...prev,
        services: exists
          ? prev.services.filter((s) => s.service_id !== serviceId)
          : [...prev.services, { service_id: serviceId, quantity: 1, include_free: false }],
      }
    })
  }

  const updateServiceOption = (serviceId: string, key: string, value: number | boolean) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((s) => s.service_id === serviceId ? { ...s, [key]: value } : s),
    }))
  }

  const toggleProduct = (productId: string) => {
    setForm((prev) => {
      const exists = prev.products.find((p) => p.product_id === productId)
      return {
        ...prev,
        products: exists
          ? prev.products.filter((p) => p.product_id !== productId)
          : [...prev.products, { product_id: productId, quantity: 1, include_free: false }],
      }
    })
  }

  const updateProductOption = (productId: string, key: string, value: number | boolean) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((p) => p.product_id === productId ? { ...p, [key]: value } : p),
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setCreating(true)
    const endpoint = editingId ? `/api/packages/${editingId}/update` : "/api/packages/create"
    const method = editingId ? "PATCH" : "POST"
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          artist_id: form.artist_id || null,
          discount_percent: Number(form.discount_percent) || 0,
          price: form.price ? Number(form.price) : calcPrice(),
          services: form.services,
          products: form.products,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (editingId) {
          setPackages((prev) => prev.map((p) => p.id === editingId ? (data.package || data) : p))
        } else {
          setPackages((prev) => [...prev, data.package || data])
        }
        resetForm()
        showToast(editingId ? "Package updated" : "Package created")
      }
    } catch {} finally { setCreating(false) }
  }

  const editPackage = (pkg: Package) => {
    setEditingId(pkg.id)
    setForm({
      name: pkg.name,
      description: pkg.description || "",
      artist_id: pkg.artist_id || "",
      discount_percent: String(pkg.discount_percent || 10),
      price: String(pkg.price || ""),
      services: pkg.services || [],
      products: pkg.products || [],
    })
    setShowCreate(true)
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setEditingId(null)
    setShowCreate(false)
  }

  const getAiSuggestions = async () => {
    setAiLoading(true)
    try {
      const res = await fetch("/api/packages/suggest-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_focus: aiFocus,
          services: allServices.map((s) => ({ id: s.id, name: s.name, price: s.base_price })),
          products: allProducts.map((p) => ({ id: p.id, name: p.name, price: p.price })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiSuggestions(data.suggestions || [])
        showToast(`${data.suggestions?.length || 0} package ideas generated`)
      }
    } catch { showToast("AI suggestion failed") } finally { setAiLoading(false) }
  }

  const applySuggestion = (suggestion: typeof aiSuggestions[0]) => {
    setForm({
      name: suggestion.name,
      description: suggestion.description,
      artist_id: "",
      discount_percent: String(suggestion.discount),
      price: "",
      services: suggestion.services.map((sid) => ({ service_id: sid, quantity: 1, include_free: false })),
      products: suggestion.products.map((pid) => ({ product_id: pid, quantity: 1, include_free: true })),
    })
    setShowCreate(true)
    setAiSuggestions([])
    showToast("Suggestion applied — adjust and save")
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
          <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Packages</h1>
          <p className="mt-1" style={{ color: "hsl(var(--text-secondary))" }}>Create service bundles with discounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreate(!showCreate); if (showCreate) resetForm() }} className="btn-primary text-sm">
            {showCreate ? "Cancel" : "Create Package"}
          </button>
        </div>
      </div>

      {/* AI Package Suggestions */}
      <div className="card-glass p-6 mb-6">
        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: "hsl(var(--text-primary))" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent-2-hex)" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M6 8h4M8 6v4"/></svg>
          AI Package Ideas
        </h3>
        <div className="flex gap-3">
          <input value={aiFocus} onChange={(e) => setAiFocus(e.target.value)} placeholder="Focus: e.g. 'bridal packages', 'first-timer deals', 'summer promotions'" className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
          <button onClick={getAiSuggestions} disabled={aiLoading} className="btn-primary text-sm disabled:opacity-50">
            {aiLoading ? "Thinking..." : "Get Ideas"}
          </button>
        </div>

        {aiSuggestions.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="card-glass p-4 cursor-pointer transition-all hover:scale-[1.02]" onClick={() => applySuggestion(s)} style={{ borderColor: "var(--accent-hex)", borderWidth: "1px" }}>
                <h4 className="font-bold text-sm mb-1" style={{ color: "hsl(var(--text-primary))" }}>{s.name}</h4>
                <p className="text-xs mb-2 line-clamp-2" style={{ color: "hsl(var(--text-secondary))" }}>{s.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-hex)15", color: "var(--accent-hex)" }}>{s.discount}% off</span>
                  <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{s.services.length} services</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {showCreate && (
        <div className="card-glass p-6 mb-6 animate-page-enter" style={{ borderColor: "var(--accent-hex)", borderWidth: "1px" }}>
          <h3 className="font-bold mb-4" style={{ color: "hsl(var(--text-primary))" }}>{editingId ? "Edit Package" : "Create Package"}</h3>

          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Package Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bridal Glow Package" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Artist</label>
                <select value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}>
                  <option value="">Any artist</option>
                  {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Package description..." rows={2} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
            </div>

            {/* Service selection */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Services</label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                {allServices.map((svc) => {
                  const selected = form.services.find((s) => s.service_id === svc.id)
                  return (
                    <div key={svc.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors" style={{ background: selected ? "var(--glass-bg)" : "transparent", border: selected ? "1px solid var(--glass-border)" : "1px solid transparent" }}>
                      <input type="checkbox" checked={!!selected} onChange={() => toggleService(svc.id)} style={{ accentColor: "var(--accent-hex)" }} />
                      <span className="flex-1 text-sm" style={{ color: "hsl(var(--text-primary))" }}>{svc.name}</span>
                      <span className="text-xs" style={{ color: "var(--accent-hex)" }}>&pound;{svc.base_price}</span>
                      {selected && (
                        <div className="flex items-center gap-2 animate-fade-in">
                          <input type="number" min={1} max={10} value={selected.quantity} onChange={(e) => updateServiceOption(svc.id, "quantity", Number(e.target.value))} className="w-14 px-2 py-1 rounded-lg text-xs text-center" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
                          <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: selected.include_free ? "#22c55e" : "hsl(var(--text-muted))" }}>
                            <input type="checkbox" checked={selected.include_free} onChange={(e) => updateServiceOption(svc.id, "include_free", e.target.checked)} style={{ accentColor: "#22c55e" }} />
                            Free
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Product selection */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Include Products</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                {allProducts.map((prod) => {
                  const selected = form.products.find((p) => p.product_id === prod.id)
                  return (
                    <div key={prod.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors" style={{ background: selected ? "var(--glass-bg)" : "transparent", border: selected ? "1px solid var(--glass-border)" : "1px solid transparent" }}>
                      <input type="checkbox" checked={!!selected} onChange={() => toggleProduct(prod.id)} style={{ accentColor: "var(--accent-hex)" }} />
                      <span className="flex-1 text-sm" style={{ color: "hsl(var(--text-primary))" }}>{prod.name}</span>
                      <span className="text-xs" style={{ color: "var(--accent-hex)" }}>&pound;{prod.price}</span>
                      {selected && (
                        <div className="flex items-center gap-2 animate-fade-in">
                          <input type="number" min={1} max={10} value={selected.quantity} onChange={(e) => updateProductOption(prod.id, "quantity", Number(e.target.value))} className="w-14 px-2 py-1 rounded-lg text-xs text-center" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
                          <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: selected.include_free ? "#22c55e" : "hsl(var(--text-muted))" }}>
                            <input type="checkbox" checked={selected.include_free} onChange={(e) => updateProductOption(prod.id, "include_free", e.target.checked)} style={{ accentColor: "#22c55e" }} />
                            Free
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Discount %</label>
                <input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} min={0} max={100} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Auto Price</label>
                <div className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: "var(--surface-2-hex)", color: "var(--accent-hex)", border: "1px solid var(--glass-border)" }}>
                  &pound;{calcPrice()}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Override Price</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="—" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={resetForm} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={creating || !form.name.trim()} className="btn-primary flex-1 text-sm disabled:opacity-50">
                {creating ? "Saving..." : editingId ? "Update Package" : "Create Package"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packages List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-glass p-6 animate-pulse">
              <div className="h-5 w-2/3 rounded mb-2" style={{ background: "var(--surface-2-hex)" }} />
              <div className="h-4 w-1/2 rounded" style={{ background: "var(--surface-2-hex)" }} />
            </div>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3" viewBox="0 0 48 48" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5" strokeLinecap="round"><rect x="8" y="12" width="32" height="24" rx="4"/><path d="M8 20h32M24 12v24"/></svg>
          <p className="mb-2" style={{ color: "hsl(var(--text-muted))" }}>No packages created yet</p>
          <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Create a bundle to offer service combos with discounts</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {packages.map((pkg) => (
            <div key={pkg.id} className="card-glass p-6 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold" style={{ color: "hsl(var(--text-primary))" }}>{pkg.name}</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-hex)15", color: "var(--accent-hex)" }}>
                  {pkg.discount_percent}% off
                </span>
              </div>
              <p className="text-xs mb-4 line-clamp-2" style={{ color: "hsl(var(--text-secondary))" }}>{pkg.description}</p>

              {pkg.services && pkg.services.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--text-muted))" }}>Services:</p>
                  <div className="flex flex-wrap gap-1">
                    {pkg.services.map((ps, i) => {
                      const svc = allServices.find((s) => s.id === ps.service_id)
                      return svc ? (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--glass-bg)", color: "hsl(var(--text-secondary))", border: "1px solid var(--glass-border)" }}>
                          {svc.name}{ps.include_free && " (free)"}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--glass-border)" }}>
                <span className="text-xl font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{pkg.price}</span>
                <button onClick={() => editPackage(pkg)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" }}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
