"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import GeometricBg from "@/components/GeometricBg"
import BookingCalendar from "@/components/BookingCalendar"

type Service = {
  id: string; name: string; description: string; base_price: number
  duration: number; image_url: string | null; artist_id: string
}
type Artist = {
  id: string; name: string; bio: string; avatar_url: string | null; specialties: string[]
}

function formatDuration(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function BookingFlow() {
  const router = useRouter()
  const params = useSearchParams()
  const serviceId = params.get("serviceId")

  const [step, setStep] = useState(1)
  const [service, setService] = useState<Service | null>(null)
  const [artist, setArtist] = useState<Artist | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreedTerms, setAgreedTerms] = useState(false)

  // Fetch service + artist
  useEffect(() => {
    if (!serviceId) { router.push("/services"); return }
    const load = async () => {
      try {
        const svcRes = await fetch(`/api/services?id=${serviceId}`)
        if (svcRes.ok) {
          const svcs = await svcRes.json()
          const svc = Array.isArray(svcs) ? svcs.find((s: Service) => s.id === serviceId) : null
          if (svc) {
            setService(svc)
            if (svc.artist_id) {
              const artRes = await fetch(`/api/artists/${svc.artist_id}`)
              if (artRes.ok) setArtist(await artRes.json())
            }
          }
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [serviceId, router])

  const handleBooking = async () => {
    if (!service || !selectedDate || !selectedTime) return
    setSubmitting(true)
    setError(null)

    try {
      const user = JSON.parse(localStorage.getItem("salon_user") || "{}")
      if (!user.id) {
        router.push(`/login?redirectTo=/services/book?serviceId=${serviceId}`)
        return
      }

      const res = await fetch("/api/bookings/create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: service.id,
          artist_id: service.artist_id,
          booking_date: selectedDate,
          booking_time: selectedTime,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create booking")
      }

      const data = await res.json()
      router.push(`/book/confirm?bookingId=${data.id || "success"}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="" className="w-12 h-12 rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen pt-24 text-center px-4">
        <p style={{ color: "hsl(var(--text-muted))" }}>Service not found</p>
        <button onClick={() => router.push("/services")} className="btn-primary mt-4 inline-block">
          Browse Services
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pt-20 pb-16">
      <GeometricBg variant="default" />

      <div className="relative max-w-3xl mx-auto px-4">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-10">
          {["Service", "Artist", "Date & Time", "Confirm"].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i + 1 <= step ? "gradient-accent text-white" : ""
                }`}
                style={
                  i + 1 > step
                    ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-muted))" }
                    : undefined
                }
              >
                {i + 1}
              </div>
              <span className="text-xs hidden sm:block" style={{ color: i + 1 <= step ? "hsl(var(--text-primary))" : "hsl(var(--text-muted))" }}>
                {label}
              </span>
              {i < 3 && (
                <div className="flex-1 h-px mx-2" style={{ background: i + 1 < step ? "var(--accent-hex)" : "var(--glass-border)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Service Summary */}
        {step === 1 && (
          <div className="animate-page-enter">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "hsl(var(--text-primary))" }}>Selected Service</h2>
            <div className="card-glass p-6 flex gap-6">
              {service.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.image_url} alt={service.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "var(--surface-2-hex)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M12 12v6"/></svg>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>{service.name}</h3>
                <p className="text-sm mt-1 line-clamp-2" style={{ color: "hsl(var(--text-secondary))" }}>{service.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-lg font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{service.base_price}</span>
                  <span className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>{formatDuration(service.duration)}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full mt-6 text-center">
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Artist */}
        {step === 2 && (
          <div className="animate-page-enter">
            <button onClick={() => setStep(1)} className="text-sm mb-6 flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-secondary))" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4"/></svg>
              Back
            </button>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "hsl(var(--text-primary))" }}>Your Artist</h2>
            {artist ? (
              <div className="card-glass p-8 text-center">
                {artist.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={artist.avatar_url} alt={artist.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--surface-2-hex)" }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5"><circle cx="16" cy="12" r="5"/><path d="M6 28c0-6 4-10 10-10s10 4 10 10"/></svg>
                  </div>
                )}
                <h3 className="text-xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>{artist.name}</h3>
                <p className="text-sm mt-2" style={{ color: "hsl(var(--text-secondary))" }}>{artist.bio}</p>
                {artist.specialties?.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {artist.specialties.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card-glass p-8 text-center">
                <p style={{ color: "hsl(var(--text-muted))" }}>Artist will be assigned</p>
              </div>
            )}
            <button onClick={() => setStep(3)} className="btn-primary w-full mt-6 text-center">
              Book with {artist?.name || "Artist"}
            </button>
          </div>
        )}

        {/* Step 3: Calendar */}
        {step === 3 && (
          <div className="animate-page-enter">
            <button onClick={() => setStep(2)} className="text-sm mb-6 flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-secondary))" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4"/></svg>
              Back
            </button>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "hsl(var(--text-primary))" }}>Choose Date & Time</h2>
            <BookingCalendar
              artistId={service.artist_id}
              duration={service.duration}
              onSelect={(date, time) => {
                setSelectedDate(date)
                setSelectedTime(time)
                setStep(4)
              }}
            />
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="animate-page-enter">
            <button onClick={() => setStep(3)} className="text-sm mb-6 flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-secondary))" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4"/></svg>
              Back
            </button>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "hsl(var(--text-primary))" }}>Confirm Booking</h2>
            <div className="card-glass p-6 space-y-4">
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <span style={{ color: "hsl(var(--text-secondary))" }}>Service</span>
                <span className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{service.name}</span>
              </div>
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <span style={{ color: "hsl(var(--text-secondary))" }}>Artist</span>
                <span className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{artist?.name || "TBA"}</span>
              </div>
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <span style={{ color: "hsl(var(--text-secondary))" }}>Date</span>
                <span className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
                  {selectedDate ? new Date(selectedDate + "T00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : ""}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <span style={{ color: "hsl(var(--text-secondary))" }}>Time</span>
                <span className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{selectedTime}</span>
              </div>
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <span style={{ color: "hsl(var(--text-secondary))" }}>Duration</span>
                <span className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{formatDuration(service.duration)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold" style={{ color: "hsl(var(--text-primary))" }}>Total</span>
                <span className="text-2xl font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{service.base_price}</span>
              </div>
            </div>

            {/* T&C Consent */}
            <label className="flex items-start gap-3 mt-6 cursor-pointer group">
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
                . I understand that tattoo, piercing and cosmetic procedures carry inherent risks. I confirm this
                is my voluntary decision and I accept full responsibility for aftercare and any outcomes following
                the procedure.
              </span>
            </label>

            {error && (
              <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                {error}
              </div>
            )}

            <button
              onClick={handleBooking}
              disabled={submitting || !agreedTerms}
              className="btn-primary w-full mt-6 text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Booking..." : "Confirm & Pay"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ServicesBookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="" className="w-12 h-12 rounded-full animate-pulse" />
      </div>
    }>
      <BookingFlow />
    </Suspense>
  )
}
