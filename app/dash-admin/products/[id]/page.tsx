"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type Product = {
  id: string; name: string; description: string; price: number
  stock: number; category: string; image_url: string | null
  is_active: boolean; marketing_suggestions?: PosterSuggestion[]
}
type PosterSuggestion = { copy: string; image_url: string; prompt: string }

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // AI Image
  const [adminFocus, setAdminFocus] = useState("")
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  // Marketing Posters
  const [posterFocus, setPosterFocus] = useState("")
  const [posterCount, setPosterCount] = useState("3")
  const [generatingPosters, setGeneratingPosters] = useState(false)
  const [posters, setPosters] = useState<PosterSuggestion[]>([])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    fetch("/api/products/get-all-products")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const all = Array.isArray(data) ? data : []
        const found = all.find((p: Product) => p.id === id)
        setProduct(found || null)
        if (found?.marketing_suggestions) setPosters(found.marketing_suggestions)
      })
      .catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const generateImage = async () => {
    if (!product) return
    setGeneratingImage(true)
    try {
      const promptRes = await fetch("/api/ai/generate-image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "product", name: product.name, description: product.description, category: product.category, admin_focus: adminFocus }),
      })
      if (!promptRes.ok) throw new Error("Failed to generate prompt")
      const { prompt: imagePrompt } = await promptRes.json()

      const imageRes = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, entity_type: "product", entity_id: product.id }),
      })
      if (!imageRes.ok) throw new Error("Failed to generate image")
      const { image_url } = await imageRes.json()

      setGeneratedImage(image_url)
      setProduct((prev) => prev ? { ...prev, image_url } : null)
      showToast("Image generated")
    } catch { showToast("Image generation failed") } finally { setGeneratingImage(false) }
  }

  const saveImage = async () => {
    if (!product || !generatedImage) return
    try {
      await fetch("/api/products/admin-update-product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, image_url: generatedImage }),
      })
      showToast("Image saved")
    } catch {}
  }

  const generatePosters = async () => {
    if (!product) return
    setGeneratingPosters(true)
    try {
      const res = await fetch("/api/ai/generate-poster-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "product", entity_id: product.id, name: product.name,
          description: product.description, price: product.price,
          category: product.category, admin_focus: posterFocus,
          count: Number(posterCount) || 3,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setPosters(data.suggestions || [])
      showToast(`${data.suggestions?.length || 0} posters generated`)
    } catch { showToast("Poster generation failed") } finally { setGeneratingPosters(false) }
  }

  if (loading) return (
    <div className="p-6 lg:p-8"><div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded" style={{ background: "var(--surface-2-hex)" }} />
      <div className="h-64 rounded-xl" style={{ background: "var(--surface-2-hex)" }} />
    </div></div>
  )

  if (!product) return (
    <div className="p-6 lg:p-8 text-center py-20">
      <p style={{ color: "hsl(var(--text-muted))" }}>Product not found</p>
      <Link href="/dash-admin/products" className="btn-primary inline-block mt-4 text-sm">Back to Products</Link>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>{toast}</div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/dash-admin/products" style={{ color: "hsl(var(--text-muted))" }} className="hover:underline">Products</Link>
        <span style={{ color: "hsl(var(--text-muted))" }}>/</span>
        <span style={{ color: "hsl(var(--text-primary))" }}>{product.name}</span>
      </div>

      {/* Product Header */}
      <div className="card-glass p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--surface-2-hex)" }}>
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5"><rect x="6" y="8" width="20" height="18" rx="3"/><path d="M10 8V6a6 6 0 0112 0v2"/></svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>{product.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs px-2.5 py-1 rounded-full capitalize" style={{ background: "var(--glass-bg)", color: "hsl(var(--text-secondary))", border: "1px solid var(--glass-border)" }}>{product.category}</span>
                  <span className="text-lg font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{product.price}</span>
                  <span className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Stock: {product.stock ?? "—"}</span>
                </div>
              </div>
              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${product.is_active !== false ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                {product.is_active !== false ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "hsl(var(--text-secondary))" }}>{product.description || "No description"}</p>
          </div>
        </div>
      </div>

      {/* AI Image Generator */}
      <div className="card-glass p-6 mb-6">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--text-primary))" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="14" height="14" rx="3"/><circle cx="7" cy="7" r="2"/><path d="M2 13l4-4 3 3 5-5 2 2"/></svg>
          AI Image Generator
        </h2>
        <div className="relative mb-3">
          <textarea value={adminFocus} onChange={(e) => setAdminFocus(e.target.value)} placeholder="Describe the style for the product image... (e.g. 'Clean white background, product spotlight, premium look')" rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
          <button
            onClick={() => { setAdminFocus("Clean white background, product spotlight, premium look, high-end studio photography style"); showToast("Example loaded") }}
            className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all hover:opacity-80"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--accent-hex)" }}
            title="Load example prompt"
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3h8"/></svg>
            Use Example
          </button>
        </div>
        <button onClick={generateImage} disabled={generatingImage} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
          {generatingImage ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10"/></svg>Generating...</>) : "Generate Image"}
        </button>
        {generatedImage && (
          <div className="animate-fade-in mt-3">
            <div className="w-full max-w-sm rounded-xl overflow-hidden mb-3" style={{ background: "var(--surface-2-hex)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generatedImage} alt="Generated" className="w-full h-auto" />
            </div>
            <button onClick={saveImage} className="btn-primary text-sm">Save as Product Image</button>
          </div>
        )}
      </div>

      {/* Marketing Poster Generator */}
      <div className="card-glass p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--text-primary))" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--accent-2-hex)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="2" width="12" height="14" rx="2"/><path d="M6 6h6M6 9h4M6 12h5"/></svg>
          Marketing Poster Generator
        </h2>
        <div className="relative mb-3">
          <textarea value={posterFocus} onChange={(e) => setPosterFocus(e.target.value)} placeholder="Marketing angle: benefits, healing properties, aftercare value, testimonial ideas..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
          <button
            onClick={() => { setPosterFocus("Focus on premium quality, healing benefits, before/after results. Use dark moody aesthetic matching Midnight Studio brand. Include price and booking CTA."); showToast("Example loaded") }}
            className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all hover:opacity-80"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--accent-hex)" }}
            title="Load example prompt"
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3h8"/></svg>
            Use Example
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select value={posterCount} onChange={(e) => setPosterCount(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}>
            <option value="3">3 suggestions</option>
            <option value="5">5 suggestions</option>
            <option value="10">10 suggestions</option>
          </select>
          <button onClick={generatePosters} disabled={generatingPosters} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
            {generatingPosters ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10"/></svg>Generating...</>) : "Generate Posters"}
          </button>
        </div>

        {posters.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {posters.map((poster, i) => (
              <div key={i} className="card-glass overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                {poster.image_url && (
                  <div className="aspect-[9/16] overflow-hidden" style={{ background: "var(--surface-2-hex)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={poster.image_url} alt={`Poster ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs leading-relaxed mb-3" style={{ color: "hsl(var(--text-secondary))" }}>{poster.copy}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(`${poster.copy}\n${poster.image_url}`); showToast("Copied") }} className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3h8"/></svg>
                      Copy
                    </button>
                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(poster.copy + "\n" + poster.image_url)}`} target="_blank" rel="noreferrer" className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{ background: "#25D36615", border: "1px solid #25D36630", color: "#25D366" }}>
                      WhatsApp
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(poster.image_url); showToast("Image URL copied") }} className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{ background: "var(--accent-hex)15", border: "1px solid var(--accent-hex)30", color: "var(--accent-hex)" }}>
                      Stories
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
