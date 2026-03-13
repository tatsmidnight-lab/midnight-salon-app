"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

type Service = {
  id: string; name: string; description: string; base_price: number
  duration: number; category_id: string; image_url: string | null
  is_active: boolean; artist_id: string; marketing_suggestions?: PosterSuggestion[]
}
type Category = { id: string; name: string }
type PosterSuggestion = { copy: string; image_url: string; prompt: string }

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // AI Image Generation
  const [adminFocus, setAdminFocus] = useState("")
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  // Marketing Poster
  const [posterFocus, setPosterFocus] = useState("")
  const [posterCount, setPosterCount] = useState("3")
  const [generatingPosters, setGeneratingPosters] = useState(false)
  const [posters, setPosters] = useState<PosterSuggestion[]>([])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    Promise.all([
      fetch(`/api/services`).then((r) => r.ok ? r.json() : []),
      fetch("/api/services/get-categories").then((r) => r.ok ? r.json() : []),
    ]).then(([svcs, cats]) => {
      const all = Array.isArray(svcs) ? svcs : []
      const found = all.find((s: Service) => s.id === id)
      setService(found || null)
      setCategories(Array.isArray(cats) ? cats : [])
      if (found?.marketing_suggestions) setPosters(found.marketing_suggestions)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const generateImage = async () => {
    if (!service) return
    setGeneratingImage(true)
    try {
      // Step 1: Generate image prompt via Claude
      const promptRes = await fetch("/api/ai/generate-image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service",
          name: service.name,
          description: service.description,
          category: categories.find(c => c.id === service.category_id)?.name || "",
          admin_focus: adminFocus,
        }),
      })
      if (!promptRes.ok) throw new Error("Failed to generate prompt")
      const { prompt: imagePrompt } = await promptRes.json()

      // Step 2: Generate image via Gemini
      const imageRes = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          entity_type: "service",
          entity_id: service.id,
        }),
      })
      if (!imageRes.ok) throw new Error("Failed to generate image")
      const { image_url } = await imageRes.json()

      setGeneratedImage(image_url)
      setService((prev) => prev ? { ...prev, image_url: image_url } : null)
      showToast("Image generated successfully")
    } catch (err) {
      showToast("Image generation failed")
    } finally { setGeneratingImage(false) }
  }

  const saveImage = async () => {
    if (!service || !generatedImage) return
    try {
      await fetch("/api/services/admin-update-service", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: service.id, image_url: generatedImage }),
      })
      showToast("Image saved")
    } catch {}
  }

  const generatePosters = async () => {
    if (!service) return
    setGeneratingPosters(true)
    try {
      const res = await fetch("/api/ai/generate-poster-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service",
          entity_id: service.id,
          name: service.name,
          description: service.description,
          price: service.base_price,
          category: categories.find(c => c.id === service.category_id)?.name || "",
          admin_focus: posterFocus,
          count: Number(posterCount) || 3,
        }),
      })
      if (!res.ok) throw new Error("Failed to generate posters")
      const data = await res.json()
      setPosters(data.suggestions || [])
      showToast(`${data.suggestions?.length || 0} posters generated`)
    } catch {
      showToast("Poster generation failed")
    } finally { setGeneratingPosters(false) }
  }

  const shareUrl = (type: string, poster: PosterSuggestion) => {
    const text = encodeURIComponent(poster.copy)
    const url = encodeURIComponent(poster.image_url)
    if (type === "whatsapp") return `https://api.whatsapp.com/send?text=${text}%20${url}`
    if (type === "copy") {
      navigator.clipboard.writeText(`${poster.copy}\n${poster.image_url}`)
      showToast("Copied to clipboard")
      return null
    }
    return null
  }

  if (loading) return (
    <div className="p-6 lg:p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded" style={{ background: "var(--surface-2-hex)" }} />
        <div className="h-64 rounded-xl" style={{ background: "var(--surface-2-hex)" }} />
      </div>
    </div>
  )

  if (!service) return (
    <div className="p-6 lg:p-8 text-center py-20">
      <p style={{ color: "hsl(var(--text-muted))" }}>Service not found</p>
      <Link href="/dash-admin/services" className="btn-primary inline-block mt-4 text-sm">Back to Services</Link>
    </div>
  )

  const catName = categories.find(c => c.id === service.category_id)?.name || "—"

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>{toast}</div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/dash-admin/services" style={{ color: "hsl(var(--text-muted))" }} className="hover:underline">Services</Link>
        <span style={{ color: "hsl(var(--text-muted))" }}>/</span>
        <span style={{ color: "hsl(var(--text-primary))" }}>{service.name}</span>
      </div>

      {/* Service Header */}
      <div className="card-glass p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--surface-2-hex)" }}>
            {service.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5"><rect x="4" y="4" width="24" height="24" rx="4"/><circle cx="12" cy="12" r="3"/><path d="M4 22l6-6 4 4 8-8 6 6"/></svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>{service.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--glass-bg)", color: "hsl(var(--text-secondary))", border: "1px solid var(--glass-border)" }}>{catName}</span>
                  <span className="text-lg font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{service.base_price}</span>
                  <span className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>{service.duration}min</span>
                </div>
              </div>
              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${service.is_active !== false ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                {service.is_active !== false ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "hsl(var(--text-secondary))" }}>{service.description || "No description"}</p>
          </div>
        </div>
      </div>

      {/* AI Image Generator */}
      <div className="card-glass p-6 mb-6">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--text-primary))" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="14" height="14" rx="3"/><circle cx="7" cy="7" r="2"/><path d="M2 13l4-4 3 3 5-5 2 2"/></svg>
          AI Image Generator
        </h2>
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={adminFocus}
              onChange={(e) => setAdminFocus(e.target.value)}
              placeholder="Admin focus: Describe the mood, style, or specific elements you want in the image... (e.g. 'Dark moody lighting, close-up of tattoo machine on skin, neon red accents')"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono"
              style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
            />
            <button
              onClick={() => { setAdminFocus("Dark moody lighting, close-up of tattoo machine on skin, neon red accents, Midnight Studio brand aesthetic, professional studio photography"); showToast("Example loaded") }}
              className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all hover:opacity-80"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--accent-hex)" }}
              title="Load example prompt"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3h8"/></svg>
              Use Example
            </button>
          </div>
          <button onClick={generateImage} disabled={generatingImage} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
            {generatingImage ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10"/></svg>
                Generating...
              </>
            ) : "Generate Image"}
          </button>

          {generatedImage && (
            <div className="animate-fade-in">
              <div className="w-full max-w-sm rounded-xl overflow-hidden mb-3" style={{ background: "var(--surface-2-hex)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={generatedImage} alt="Generated" className="w-full h-auto" />
              </div>
              <button onClick={saveImage} className="btn-primary text-sm">Save as Service Image</button>
            </div>
          )}
        </div>
      </div>

      {/* Marketing Poster Generator */}
      <div className="card-glass p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--text-primary))" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--accent-2-hex)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="2" width="12" height="14" rx="2"/><path d="M6 6h6M6 9h4M6 12h5"/></svg>
          Marketing Poster Generator
        </h2>
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={posterFocus}
              onChange={(e) => setPosterFocus(e.target.value)}
              placeholder="Focus for marketing copy: promotional angle, target audience, special offers... (e.g. 'Summer flash sale, 20% off, appeal to first-timers')"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono"
              style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
            />
            <button
              onClick={() => { setPosterFocus("Summer flash sale, 20% off for first-timers, dark moody aesthetic, Midnight Studio brand, include price and booking CTA, Instagram Stories format"); showToast("Example loaded") }}
              className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all hover:opacity-80"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--accent-hex)" }}
              title="Load example prompt"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3h8"/></svg>
              Use Example
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select value={posterCount} onChange={(e) => setPosterCount(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}>
              <option value="3">3 suggestions</option>
              <option value="5">5 suggestions</option>
              <option value="10">10 suggestions</option>
            </select>
            <button onClick={generatePosters} disabled={generatingPosters} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
              {generatingPosters ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10"/></svg>
                  Generating...
                </>
              ) : "Generate Posters"}
            </button>
          </div>
        </div>

        {/* Poster grid */}
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
                    <button onClick={() => shareUrl("copy", poster)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3h8"/></svg>
                      Copy
                    </button>
                    <a href={shareUrl("whatsapp", poster) || "#"} target="_blank" rel="noreferrer" className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{ background: "#25D36615", border: "1px solid #25D36630", color: "#25D366" }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 00-6.1 10.4L1 15l3.7-.9A7 7 0 108 1z"/></svg>
                      WhatsApp
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(poster.image_url); showToast("Image URL copied") }} className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{ background: "var(--accent-hex)15", border: "1px solid var(--accent-hex)30", color: "var(--accent-hex)" }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2h4v4M6 10l8-8"/><path d="M14 9v5a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1h5"/></svg>
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
