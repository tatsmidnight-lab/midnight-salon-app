"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import GeometricBg from "@/components/GeometricBg"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get("redirectTo") || "/profile"

  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreedTerms, setAgreedTerms] = useState(false)

  // Normalize UK numbers: 07xxx → +447xxx
  const normalizePhone = (raw: string) => {
    let p = raw.replace(/[\s\-().]/g, "")
    if (/^0[1-9]\d{8,10}$/.test(p)) p = "+44" + p.slice(1)
    if (/^44[1-9]\d{8,10}$/.test(p)) p = "+" + p
    return p
  }

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return
    setLoading(true)
    setError(null)

    const normalized = normalizePhone(phone)
    try {
      const res = await fetch("/api/auth/login-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send code")
      setStep("otp")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone), code: otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid code")

      // Store user info
      if (data.user) {
        localStorage.setItem("salon_user", JSON.stringify(data.user))
      }

      router.push(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen pt-20 flex items-center justify-center px-4">
      <GeometricBg variant="default" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Midnight" className="w-16 h-16 rounded-full mx-auto mb-4" />
          <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
            Sign In
          </h1>
          <p className="mt-2 text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
            {step === "phone"
              ? "Enter your phone number to receive a verification code"
              : "Enter the code we sent to your phone"}
          </p>
        </div>

        <div className="card-glass p-8">
          {step === "phone" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7958 747929"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                  style={{
                    background: "var(--surface-2-hex)",
                    color: "hsl(var(--text-primary))",
                    border: "1px solid var(--glass-border)",
                  }}
                />
              </div>

              {error && (
                <p className="text-sm p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-[var(--accent-hex)] flex-shrink-0"
                />
                <span className="text-xs leading-relaxed" style={{ color: "hsl(var(--text-secondary))" }}>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="underline font-semibold" style={{ color: "var(--accent-hex)" }}>
                    Terms & Conditions
                  </a>
                </span>
              </label>

              <button type="submit" disabled={loading || !agreedTerms} className="btn-primary w-full text-center disabled:opacity-50">
                {loading ? "Sending..." : "Send Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-secondary))" }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  required
                  autoFocus
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all focus:ring-2"
                  style={{
                    background: "var(--surface-2-hex)",
                    color: "hsl(var(--text-primary))",
                    border: "1px solid var(--glass-border)",
                  }}
                />
              </div>

              {error && (
                <p className="text-sm p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-50">
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("phone"); setOtp(""); setError(null) }}
                className="w-full text-center text-sm hover:opacity-80 transition-opacity"
                style={{ color: "hsl(var(--text-secondary))" }}
              >
                Change phone number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="" className="w-12 h-12 rounded-full animate-pulse" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
