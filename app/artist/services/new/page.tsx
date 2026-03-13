"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import VoiceInput from "@/components/VoiceInput"

type ServiceForm = {
  name: string; description: string; price: string; duration: string; imageUrl: string
}

export default function NewServicePage() {
  const router = useRouter()
  const [mode, setMode] = useState<"voice" | "manual">("voice")
  const [form, setForm] = useState<ServiceForm>({ name: "", description: "", price: "", duration: "", imageUrl: "" })
  const [transcript, setTranscript] = useState("")
  const [extracting, setExtracting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVoiceTranscript = async (t: string) => {
    setTranscript(t)
    setExtracting(true)
    try {
      const res = await fetch("/api/webhooks/artist-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: t,
          artistId: (() => { try { return JSON.parse(localStorage.getItem("salon_user") || "{}").artist_id || "unknown" } catch { return "unknown" } })(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.service) {
          setForm({
            name: data.service.name ?? "",
            description: data.service.description ?? "",
            price: String(data.service.price ?? ""),
            duration: String(data.service.duration ?? ""),
            imageUrl: data.service.image_url ?? "",
          })
        }
      }
    } catch {} finally { setExtracting(false) }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.duration) {
      setError("Name, price, and duration are required.")
      return
    }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch("/api/webhooks/artist-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript, serviceName: form.name, description: form.description,
          price: Number(form.price), duration: Number(form.duration),
          imageUrl: form.imageUrl, mode: "create",
        }),
      })
      if (!res.ok) throw new Error("Failed to create service")
      setSuccess(true)
      setTimeout(() => router.push("/artist/services"), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally { setSubmitting(false) }
  }

  if (success) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M8 16l5 5 11-11"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>Service Created!</h2>
          <p style={{ color: "hsl(var(--text-secondary))" }}>Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      <button onClick={() => router.push("/artist/services")} className="text-sm mb-6 flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-secondary))" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4"/></svg>
        Back to Services
      </button>

      <h1 className="text-3xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>Add New Service</h1>
      <p className="mb-8" style={{ color: "hsl(var(--text-secondary))" }}>Describe your service by voice or fill in manually</p>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
        <button onClick={() => setMode("voice")} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${mode === "voice" ? "gradient-accent text-white" : ""}`} style={mode !== "voice" ? { color: "hsl(var(--text-secondary))" } : undefined}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="1" width="6" height="10" rx="3"/><path d="M3 7a5 5 0 0010 0M8 12v3"/></svg>
          Voice
        </button>
        <button onClick={() => setMode("manual")} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${mode === "manual" ? "gradient-accent text-white" : ""}`} style={mode !== "manual" ? { color: "hsl(var(--text-secondary))" } : undefined}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h12M2 7h8M2 11h10"/></svg>
          Manual
        </button>
      </div>

      {/* Voice mode */}
      {mode === "voice" && (
        <div className="space-y-4 mb-8">
          <VoiceInput onTranscript={handleVoiceTranscript} placeholder='Tap the mic and describe your service...' />
          {extracting && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--accent-hex)" }}>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10"/></svg>
              Extracting service details with AI...
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {(mode === "manual" || transcript) && (
        <div className="card-glass p-6 space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Service Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Full Sleeve Tattoo" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what this service includes..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Price (GBP) *</label>
              <input type="number" min="0" step="5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="150" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Duration (min) *</label>
              <input type="number" min="15" step="15" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="90" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Image URL (optional)</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }} />
          </div>

          {error && (
            <p className="text-sm p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</p>
          )}

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full text-center disabled:opacity-50">
            {submitting ? "Creating..." : "Create Service"}
          </button>
        </div>
      )}
    </div>
  )
}
