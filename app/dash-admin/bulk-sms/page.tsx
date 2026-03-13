"use client"

import { useState } from "react"

export default function AdminBulkSmsPage() {
  const [recipients, setRecipients] = useState<"all" | "recent">("all")
  const [template, setTemplate] = useState("Hi {customer_name}, we have exciting news from Midnight Studio! 🎨")
  const [preview, setPreview] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handlePreview = () => {
    setPreview(template.replace("{customer_name}", "Sarah").replace("{date}", "15 March").replace("{service}", "Custom Tattoo"))
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await fetch("/api/webhooks/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bulk_sms", template, recipients }),
      })
      setSent(true)
    } catch {} finally { setSending(false) }
  }

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>Bulk SMS</h1>
      <p className="mb-8" style={{ color: "hsl(var(--text-secondary))" }}>Send promotional messages to customers</p>

      {sent ? (
        <div className="card-glass p-12 text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M8 16l5 5 11-11"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>Messages Queued!</h2>
          <p style={{ color: "hsl(var(--text-secondary))" }}>SMS delivery in progress</p>
          <button onClick={() => setSent(false)} className="btn-primary mt-6 text-sm">Send Another</button>
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Recipients */}
          <div className="card-glass p-6">
            <h3 className="font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>Recipients</h3>
            <div className="flex gap-2">
              {(["all", "recent"] as const).map((r) => (
                <button key={r} onClick={() => setRecipients(r)} className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${recipients === r ? "gradient-accent text-white" : ""}`} style={recipients !== r ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}>
                  {r === "all" ? "All Customers" : "Recent Customers"}
                </button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div className="card-glass p-6">
            <h3 className="font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>Message Template</h3>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
              style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
            />
            <p className="text-xs mb-4" style={{ color: "hsl(var(--text-muted))" }}>
              Available placeholders: {"{customer_name}"} {"{date}"} {"{service}"}
            </p>
            <button onClick={handlePreview} className="btn-secondary text-sm">Preview Message</button>
          </div>

          {/* Preview */}
          {preview && (
            <div className="card-glass p-6 animate-page-enter">
              <h3 className="font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>Preview</h3>
              <div className="p-4 rounded-xl text-sm" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))" }}>
                {preview}
              </div>
            </div>
          )}

          <button onClick={handleSend} disabled={sending} className="btn-primary w-full text-center disabled:opacity-50">
            {sending ? "Sending..." : "Send to All"}
          </button>
        </div>
      )}
    </div>
  )
}
