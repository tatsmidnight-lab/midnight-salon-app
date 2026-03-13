"use client"

import { useState } from "react"
import GeometricBg from "@/components/GeometricBg"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, just show success — wire to API later
    setSent(true)
  }

  return (
    <div className="relative min-h-screen pt-20 pb-16">
      <GeometricBg variant="grid" />

      <div className="relative max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
            Contact
          </h1>
          <p style={{ color: "hsl(var(--text-secondary))" }}>
            Get in touch — we&apos;d love to hear from you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Info */}
          <div className="space-y-6">
            <div className="card-glass p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent-hex)" }}>Phone</h3>
              <a href="tel:+447958747929" className="text-lg font-semibold hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-primary))" }}>
                07958 747929
              </a>
            </div>

            <div className="card-glass p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent-hex)" }}>Email</h3>
              <a href="mailto:hello@midnight.studio" className="text-lg font-semibold hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-primary))" }}>
                hello@midnight.studio
              </a>
            </div>

            <div className="card-glass p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent-hex)" }}>Location</h3>
              <p style={{ color: "hsl(var(--text-primary))" }}>Glasgow, Scotland</p>
            </div>

            <div className="card-glass p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent-hex)" }}>Opening Hours</h3>
              <div className="space-y-2 text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
                <div className="flex justify-between"><span>Monday</span><span>11:00 AM – 11:00 PM</span></div>
                <div className="flex justify-between"><span>Tuesday</span><span>11:00 AM – 11:00 PM</span></div>
                <div className="flex justify-between"><span>Wednesday</span><span>11:00 AM – 11:00 PM</span></div>
                <div className="flex justify-between"><span>Thursday</span><span>11:00 AM – 11:00 PM</span></div>
                <div className="flex justify-between"><span>Friday</span><span>11:00 AM – 11:00 PM</span></div>
                <div className="flex justify-between"><span>Saturday</span><span>11:00 AM – 11:00 PM</span></div>
                <div className="flex justify-between"><span>Sunday</span><span>11:00 AM – 11:00 PM</span></div>
              </div>
            </div>

            <div className="card-glass p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent-hex)" }}>Social</h3>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/midnight.tats/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-primary))" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
                  Instagram
                </a>
                <a href="https://www.tiktok.com/@midnight.tats" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-primary))" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 12a4 4 0 104 4V4c1 2.5 3.5 4 6 4"/></svg>
                  TikTok
                </a>
              </div>
            </div>
          </div>

          {/* Form + Map */}
          <div className="space-y-6">
            <div className="card-glass p-6">
              {sent ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 48 48" fill="none" stroke="var(--accent-hex)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="24" cy="24" r="20" />
                    <path d="M14 24l6 6 14-14" />
                  </svg>
                  <h3 className="text-xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>Message Sent!</h3>
                  <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>We&apos;ll get back to you soon</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                      style={{
                        background: "var(--surface-2-hex)",
                        color: "hsl(var(--text-primary))",
                        border: "1px solid var(--glass-border)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                      style={{
                        background: "var(--surface-2-hex)",
                        color: "hsl(var(--text-primary))",
                        border: "1px solid var(--glass-border)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>Message</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all focus:ring-2"
                      style={{
                        background: "var(--surface-2-hex)",
                        color: "hsl(var(--text-primary))",
                        border: "1px solid var(--glass-border)",
                      }}
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full text-center">
                    Send Message
                  </button>
                </form>
              )}
            </div>

            <div className="card-glass overflow-hidden" style={{ minHeight: 280 }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d35828.73289963845!2d-4.251806!3d55.860916!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x488815562056ceeb%3A0x71e683b805ef511e!2sGlasgow%2C%20UK!5e0!3m2!1sen!2suk!4v1"
                width="100%"
                height="280"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
