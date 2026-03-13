"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"

type Product = {
  id: string; name: string; description: string; price: number; stock: number
  category: string; image_url: string | null; is_active: boolean
}

const CATEGORIES = ["all", "aftercare", "jewellery", "merch", "gift_card"] as const
const CATEGORY_LABELS: Record<string, string> = {
  all: "All", aftercare: "Aftercare", jewellery: "Jewellery", merch: "Merch", gift_card: "Gift Cards",
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [toast, setToast] = useState<string | null>(null)

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Quick edit modal
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState({ name: "", category: "", price: "", stock: "", is_active: true })
  const [saving, setSaving] = useState(false)

  // Bulk upload
  const [showBulk, setShowBulk] = useState(false)
  const [bulkJson, setBulkJson] = useState("")
  const [bulkParsed, setBulkParsed] = useState<any[] | null>(null)
  const [bulkError, setBulkError] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)

  // AI Suggest
  const [showAiSuggest, setShowAiSuggest] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState<any[] | null>(null)
  const [aiCopied, setAiCopied] = useState(false)

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = () => {
    setLoading(true)
    fetch("/api/products/get-all-products")
      .then((r) => r.ok ? r.json() : { products: [] })
      .then((data) => setProducts(Array.isArray(data) ? data : data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.is_active).length,
    categories: new Set(products.map((p) => p.category).filter(Boolean)).size,
    lowStock: products.filter((p) => p.stock !== undefined && p.stock <= 5).length,
  }), [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === "all" || p.category === catFilter
      return matchSearch && matchCat
    })
  }, [products, search, catFilter])

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((p) => p.id)))
  }

  // Quick edit
  const openEdit = (product: Product) => {
    setEditProduct(product)
    setEditForm({
      name: product.name || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      is_active: product.is_active !== false,
    })
  }

  const saveEdit = async () => {
    if (!editProduct) return
    setSaving(true)
    try {
      const res = await fetch("/api/products/admin-update-product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: editProduct.id,
          name: editForm.name,
          category: editForm.category,
          price: Number(editForm.price),
          stock: Number(editForm.stock),
          is_active: editForm.is_active,
        }),
      })
      if (res.ok) {
        setProducts((prev) => prev.map((p) => p.id === editProduct.id ? {
          ...p, name: editForm.name, category: editForm.category,
          price: Number(editForm.price), stock: Number(editForm.stock), is_active: editForm.is_active,
        } : p))
        setEditProduct(null)
        showToast("Product updated")
      }
    } catch { showToast("Failed to update") }
    finally { setSaving(false) }
  }

  // Delete single
  const deleteProduct = async (id: string) => {
    try {
      await fetch("/api/products/admin-delete-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: id }),
      })
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
      showToast("Product deleted")
    } catch { showToast("Failed to delete") }
  }

  // Bulk delete
  const bulkDelete = async () => {
    const promises = Array.from(selectedIds).map((id) =>
      fetch("/api/products/admin-delete-product", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: id }),
      })
    )
    await Promise.all(promises)
    setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)))
    showToast(`${selectedIds.size} products deleted`)
    setSelectedIds(new Set())
  }

  // Bulk toggle visibility
  const bulkToggleVisibility = async (active: boolean) => {
    const promises = Array.from(selectedIds).map((id) =>
      fetch("/api/products/admin-update-product", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: id, is_active: active }),
      })
    )
    await Promise.all(promises)
    setProducts((prev) => prev.map((p) => selectedIds.has(p.id) ? { ...p, is_active: active } : p))
    showToast(`${selectedIds.size} products ${active ? "activated" : "deactivated"}`)
    setSelectedIds(new Set())
  }

  // Bulk upload
  const parseBulkJson = () => {
    setBulkError("")
    setBulkParsed(null)
    try {
      const parsed = JSON.parse(bulkJson)
      if (!Array.isArray(parsed)) throw new Error("Must be an array")
      setBulkParsed(parsed)
    } catch {
      setBulkError("Invalid JSON - must be an array of product objects")
    }
  }

  const AI_PROMPT_EXAMPLE = `Suggest 5 new aftercare products for a tattoo and piercing studio called Midnight Studio. Include:
- Product name
- Short description (1-2 sentences)
- Price in GBP
- Category (aftercare, jewellery, merch, or gift_card)
- Stock quantity

Focus on premium, organic, and vegan-friendly products that complement our existing range.`

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiResults(null)
    try {
      const res = await fetch("/api/ai/suggest-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      if (!res.ok) {
        // Fallback: use the packages suggest endpoint
        const fallbackRes = await fetch("/api/packages/suggest-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_focus: aiPrompt, services: [], products: products.map(p => ({ id: p.id, name: p.name, price: p.price })) }),
        })
        if (fallbackRes.ok) {
          const data = await fallbackRes.json()
          setAiResults(data.suggestions || [])
        } else {
          throw new Error("AI suggestion failed")
        }
      } else {
        const data = await res.json()
        setAiResults(data.products || data.suggestions || [])
      }
      showToast("AI suggestions ready")
    } catch { showToast("AI suggestion failed — try again") }
    finally { setAiLoading(false) }
  }

  const copyAiResultsJson = () => {
    if (!aiResults) return
    const json = JSON.stringify(aiResults.map(p => ({
      name: p.name,
      description: p.description || "",
      price: p.price || 0,
      category: p.category || "aftercare",
      stock: p.stock ?? p.stock_qty ?? 50,
      is_active: true,
    })), null, 2)
    navigator.clipboard.writeText(json)
    setAiCopied(true)
    setTimeout(() => setAiCopied(false), 2000)
    showToast("JSON copied — paste into Bulk Upload")
  }

  const addAiResultsDirectly = async () => {
    if (!aiResults) return
    setBulkLoading(true)
    try {
      const payload = aiResults.map(p => ({
        name: p.name,
        description: p.description || "",
        price: p.price || 0,
        category: p.category || "aftercare",
        stock: p.stock ?? p.stock_qty ?? 50,
        is_active: true,
      }))
      const res = await fetch("/api/products/admin-bulk-upload-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: payload }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.products) setProducts((prev) => [...prev, ...data.products])
        setAiResults(null)
        setShowAiSuggest(false)
        setAiPrompt("")
        showToast(`${data.products?.length || payload.length} products added`)
      } else throw new Error("Failed")
    } catch { showToast("Failed to add products") }
    finally { setBulkLoading(false) }
  }

  const handleBulkUpload = async () => {
    if (!bulkParsed) return
    setBulkLoading(true)
    try {
      const res = await fetch("/api/products/admin-bulk-upload-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: bulkParsed }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.products) setProducts((prev) => [...prev, ...data.products])
        setShowBulk(false)
        setBulkJson("")
        setBulkParsed(null)
        showToast(`${data.products?.length || bulkParsed.length} products created`)
      } else throw new Error("Failed")
    } catch { setBulkError("Bulk upload failed") }
    finally { setBulkLoading(false) }
  }

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>{toast}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Products</h1>
          <p className="mt-1" style={{ color: "hsl(var(--text-secondary))" }}>Stock, categories & inventory management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowAiSuggest(!showAiSuggest); setShowBulk(false) }} className="btn-primary !py-2 !px-4 text-xs flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M6 8h4M8 6v4"/></svg>
            AI Suggest
          </button>
          <button onClick={() => { setShowBulk(!showBulk); setShowAiSuggest(false) }} className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 10V3M5 5l3-3 3 3"/><path d="M2 11v2a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
            Bulk Upload
          </button>
          <button onClick={fetchProducts} className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8a6 6 0 0110.9-3.5M14 8a6 6 0 01-10.9 3.5"/><path d="M14 2v4h-4M2 14v-4h4"/></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Products", value: stats.total, color: "var(--accent-hex)" },
          { label: "Active", value: stats.active, color: "#22c55e" },
          { label: "Categories", value: stats.categories, color: "#8b5cf6" },
          { label: "Low Stock", value: stats.lowStock, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="card-glass p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI Suggest Panel */}
      {showAiSuggest && (
        <div className="card-glass p-6 mb-6 animate-page-enter" style={{ borderColor: "var(--accent-hex)", borderWidth: "1px" }}>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: "hsl(var(--text-primary))" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M6 8h4M8 6v4"/></svg>
            AI Product Suggestions
          </h3>
          <p className="text-xs mb-3" style={{ color: "hsl(var(--text-muted))" }}>
            Describe what products you want and AI will generate a list you can add directly.
          </p>

          {/* Prompt area with copy example button */}
          <div className="relative mb-3">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={AI_PROMPT_EXAMPLE}
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono"
              style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
            />
            <button
              onClick={() => { setAiPrompt(AI_PROMPT_EXAMPLE); showToast("Example prompt loaded") }}
              className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all hover:opacity-80"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--accent-hex)" }}
              title="Copy example prompt"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3h8"/></svg>
              Use Example
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={handleAiSuggest} disabled={aiLoading || !aiPrompt.trim()} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
              {aiLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10"/></svg>Generating...</>) : "Generate Suggestions"}
            </button>
            <button onClick={() => { setShowAiSuggest(false); setAiResults(null) }} className="btn-secondary text-sm">Cancel</button>
          </div>

          {/* AI Results */}
          {aiResults && aiResults.length > 0 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{aiResults.length} products suggested:</p>
                <div className="flex gap-2">
                  <button
                    onClick={copyAiResultsJson}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                    style={{ background: aiCopied ? "rgba(34,197,94,0.15)" : "var(--glass-bg)", border: `1px solid ${aiCopied ? "rgba(34,197,94,0.3)" : "var(--glass-border)"}`, color: aiCopied ? "#22c55e" : "hsl(var(--text-secondary))" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3h8"/></svg>
                    {aiCopied ? "Copied!" : "Copy JSON"}
                  </button>
                  <button
                    onClick={addAiResultsDirectly}
                    disabled={bulkLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2v12M2 8h12"/></svg>
                    {bulkLoading ? "Adding..." : "Add All Products"}
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto rounded-xl p-3" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
                {aiResults.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "var(--surface-2-hex)" }}>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold block truncate" style={{ color: "hsl(var(--text-primary))" }}>{item.name}</span>
                      {item.description && <span className="text-[10px] block truncate" style={{ color: "hsl(var(--text-muted))" }}>{item.description}</span>}
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "var(--glass-bg)", color: "hsl(var(--text-secondary))", border: "1px solid var(--glass-border)" }}>{item.category || "—"}</span>
                      <span className="text-xs font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{item.price || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Upload Panel */}
      {showBulk && (
        <div className="card-glass p-6 mb-6 animate-page-enter" style={{ borderColor: "var(--accent-hex)", borderWidth: "1px" }}>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: "hsl(var(--text-primary))" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round"><path d="M8 10V3M5 5l3-3 3 3"/><path d="M2 11v2a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
            Bulk Upload Products
          </h3>
          <p className="text-xs mb-3" style={{ color: "hsl(var(--text-muted))" }}>
            Paste a JSON array of products. Each object: name, description, price, stock, category, is_active.
          </p>
          <textarea
            value={bulkJson}
            onChange={(e) => { setBulkJson(e.target.value); setBulkParsed(null); setBulkError("") }}
            placeholder={'[{"name":"Aftercare Balm","price":12.99,"stock":50,"category":"aftercare","is_active":true}]'}
            rows={6}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono mb-3"
            style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
          />
          {bulkError && <p className="text-xs text-red-400 mb-2">{bulkError}</p>}

          {/* Preview parsed items */}
          {bulkParsed && (
            <div className="mb-3 rounded-xl p-3" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "hsl(var(--text-primary))" }}>{bulkParsed.length} items to create:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {bulkParsed.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded" style={{ background: "var(--surface-2-hex)" }}>
                    <span style={{ color: "hsl(var(--text-primary))" }}>{item.name || `Item ${i + 1}`}</span>
                    <span style={{ color: "var(--accent-hex)" }}>&pound;{item.price || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!bulkParsed ? (
              <button onClick={parseBulkJson} disabled={!bulkJson.trim()} className="btn-primary text-sm disabled:opacity-50">Preview</button>
            ) : (
              <button onClick={handleBulkUpload} disabled={bulkLoading} className="btn-primary text-sm disabled:opacity-50">
                {bulkLoading ? "Creating..." : "Create All"}
              </button>
            )}
            <button onClick={() => { setShowBulk(false); setBulkParsed(null); setBulkError("") }} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search + Category Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-2 rounded-full text-xs font-semibold transition-all ${catFilter === c ? "gradient-accent text-white" : ""}`}
              style={catFilter !== c ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}
            >
              {CATEGORY_LABELS[c] || c}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="card-glass p-3 mb-4 flex items-center gap-3 animate-fade-in">
          <span className="text-xs font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{selectedIds.size} selected</span>
          <button onClick={() => bulkToggleVisibility(true)} className="text-xs font-semibold" style={{ color: "#22c55e" }}>Activate</button>
          <button onClick={() => bulkToggleVisibility(false)} className="text-xs font-semibold" style={{ color: "#f59e0b" }}>Deactivate</button>
          <button onClick={bulkDelete} className="text-xs font-semibold text-red-400 hover:text-red-300">Delete</button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    style={{ accentColor: "var(--accent-hex)" }}
                  />
                </th>
                {["Product", "Category", "Price", "Stock", "Active", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ background: "var(--surface-2-hex)", width: `${50 + Math.random() * 40}%` }} />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color: "hsl(var(--text-muted))" }}>
                  {search ? "No products match" : "No products"}
                </td></tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="group transition-colors"
                    style={{ borderBottom: "1px solid var(--glass-border)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--glass-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        style={{ accentColor: "var(--accent-hex)" }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--surface-2-hex)" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--surface-2-hex)" }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><circle cx="6" cy="6" r="1.5"/><path d="M2 11l3-3 2 2 4-4 3 3"/></svg>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{product.name}</span>
                          {!product.is_active && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">Inactive</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ background: "var(--glass-bg)", color: "hsl(var(--text-secondary))", border: "1px solid var(--glass-border)" }}>
                        {product.category || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{product.price?.toFixed(2) || "0.00"}</td>
                    <td className="px-4 py-3">
                      <span style={{ color: product.stock <= 5 ? "#ef4444" : "hsl(var(--text-secondary))" }}>
                        {product.stock ?? "—"}
                        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
                          <span className="text-xs ml-1 text-amber-400">Low</span>
                        )}
                        {product.stock === 0 && <span className="text-xs ml-1 text-red-400">Out</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold uppercase px-2 py-1 rounded-full" style={{
                        color: product.is_active ? "#22c55e" : "#ef4444",
                        background: product.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      }}>
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }} title="Quick edit">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-secondary))" strokeWidth="1.5" strokeLinecap="round"><path d="M11.5 1.5l3 3L5 14H2v-3z"/></svg>
                        </button>
                        <Link href={`/dash-admin/products/${product.id}`} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }} title="View detail">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-secondary))" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8s3-5 6-5 6 5 6 5-3 5-6 5-6-5-6-5z"/><circle cx="8" cy="8" r="2"/></svg>
                        </Link>
                        <button onClick={() => deleteProduct(product.id)} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }} title="Delete">
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
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditProduct(null)} />
          <div className="relative w-full max-w-md card-glass p-6 animate-scale-in" style={{ background: "var(--surface-hex)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-primary))" }}>Quick Edit</h2>
              <button onClick={() => setEditProduct(null)} className="p-1" style={{ color: "hsl(var(--text-muted))" }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Product Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                >
                  <option value="">None</option>
                  {CATEGORIES.filter((c) => c !== "all").map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Price (&pound;)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Stock</label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-xs font-semibold" style={{ color: "hsl(var(--text-secondary))" }}>Active</label>
                <button
                  onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  className="w-12 h-6 rounded-full transition-all relative"
                  style={{ background: editForm.is_active ? "#22c55e" : "var(--surface-2-hex)", border: "1px solid var(--glass-border)" }}
                >
                  <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: editForm.is_active ? "calc(100% - 22px)" : "2px" }} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditProduct(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 text-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
