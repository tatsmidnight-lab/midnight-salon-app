"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"

const FullCalendar = dynamic(
  () => import("@fullcalendar/react").then((m) => m.default),
  { ssr: false }
)

import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

type Booking = {
  id: string; booking_date: string; booking_time: string; status: string
  duration_minutes?: number; total_price?: number
  services?: { name: string; duration: number }
  customers?: { display_name: string; phone: string }
}

type DayAvailability = {
  date: string
  slots: { time: string; available: boolean }[]
}

type WorkingHours = {
  [day: string]: { enabled: boolean; start: string; end: string }
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const HOURS = Array.from({ length: 12 }, (_, i) => `${(11 + i).toString().padStart(2, "0")}:00`)

const DEFAULT_HOURS: WorkingHours = Object.fromEntries(
  DAYS.map(d => [d, { enabled: d !== "Sunday", start: "11:00", end: "23:00" }])
)

export default function ArtistCalendarPage() {
  const [view, setView] = useState<"calendar" | "availability" | "schedule">("calendar")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_HOURS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // Get artist_id from user profile
  const [artistId, setArtistId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("salon_user")
      if (raw) {
        const user = JSON.parse(raw)
        // Fetch artist profile
        fetch(`/api/artists/get-profile?user_id=${user.id}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.id) setArtistId(data.id) })
          .catch(() => {})
      }
    } catch {}

    // Load saved hours
    try {
      const saved = localStorage.getItem("midnight_working_hours")
      if (saved) setWorkingHours(JSON.parse(saved))
    } catch {}
  }, [])

  // Fetch bookings
  useEffect(() => {
    setLoading(true)
    fetch("/api/bookings/get-artist-bookings")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const bookingsData = Array.isArray(data) ? data : data.bookings || []
        setBookings(bookingsData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Generate availability for selected date
  const selectedDaySlots = useMemo(() => {
    const existing = availability.find(a => a.date === selectedDate)
    if (existing) return existing.slots

    // Generate default slots based on working hours
    const dayOfWeek = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })
    const hours = workingHours[dayOfWeek]
    if (!hours?.enabled) return []

    const startHour = parseInt(hours.start.split(":")[0])
    const endHour = parseInt(hours.end.split(":")[0])
    return Array.from({ length: endHour - startHour }, (_, i) => ({
      time: `${(startHour + i).toString().padStart(2, "0")}:00`,
      available: true,
    }))
  }, [selectedDate, availability, workingHours])

  // Toggle a slot
  const toggleSlot = useCallback((time: string) => {
    setAvailability(prev => {
      const existing = prev.find(a => a.date === selectedDate)
      if (existing) {
        return prev.map(a => {
          if (a.date !== selectedDate) return a
          return {
            ...a,
            slots: a.slots.map(s => s.time === time ? { ...s, available: !s.available } : s)
          }
        })
      }
      // Create new entry
      const dayOfWeek = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })
      const hours = workingHours[dayOfWeek]
      if (!hours?.enabled) return prev
      const startHour = parseInt(hours.start.split(":")[0])
      const endHour = parseInt(hours.end.split(":")[0])
      const slots = Array.from({ length: endHour - startHour }, (_, i) => {
        const t = `${(startHour + i).toString().padStart(2, "0")}:00`
        return { time: t, available: t === time ? false : true }
      })
      return [...prev, { date: selectedDate, slots }]
    })
  }, [selectedDate, workingHours])

  // Mark entire day as off
  const toggleDayOff = useCallback((date: string) => {
    setAvailability(prev => {
      const existing = prev.find(a => a.date === date)
      if (existing) {
        const allOff = existing.slots.every(s => !s.available)
        return prev.map(a => {
          if (a.date !== date) return a
          return { ...a, slots: a.slots.map(s => ({ ...s, available: allOff })) }
        })
      }
      // Create day with all slots off
      return [...prev, { date, slots: HOURS.map(t => ({ time: t, available: false })) }]
    })
  }, [])

  // Save availability to DB + n8n
  const saveAvailability = async () => {
    if (!artistId) { showToast("Artist profile not found"); return }
    setSaving(true)
    try {
      // Save each day's availability
      const daysToSave = availability.filter(a => a.slots.length > 0)
      if (daysToSave.length === 0) { showToast("No changes to save"); setSaving(false); return }

      const res = await fetch("/api/availability/bulk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist_id: artistId, availability: daysToSave }),
      })

      if (res.ok) {
        showToast(`Saved ${daysToSave.length} day(s) — syncing to calendar`)
      } else {
        // Fallback: save individually
        for (const day of daysToSave) {
          await fetch("/api/availability/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ artist_id: artistId, date: day.date, slots: day.slots }),
          }).catch(() => {})
        }
        showToast(`Saved ${daysToSave.length} day(s)`)
      }
    } catch {
      showToast("Failed to save availability")
    } finally {
      setSaving(false)
    }
  }

  const saveWorkingHours = useCallback((hours: WorkingHours) => {
    setWorkingHours(hours)
    localStorage.setItem("midnight_working_hours", JSON.stringify(hours))
  }, [])

  // Calendar events from bookings
  const calendarEvents = useMemo(() => {
    const events: Array<{
      id: string; title: string; start: string; end?: string
      backgroundColor: string; borderColor: string; textColor: string
      extendedProps: { status: string; customer: string; price: number }
    }> = []

    bookings.forEach(b => {
      const date = b.booking_date || ""
      const time = b.booking_time || "11:00"
      const duration = b.duration_minutes || b.services?.duration || 60
      const startStr = `${date}T${time}`
      const endMs = new Date(startStr).getTime() + duration * 60000

      const colorMap: Record<string, string> = {
        pending: "#f59e0b",
        confirmed: "var(--accent-hex)",
        completed: "#22c55e",
        cancelled: "#6b7280",
        no_show: "#ef4444",
      }

      events.push({
        id: b.id,
        title: b.services?.name || "Booking",
        start: startStr,
        end: new Date(endMs).toISOString(),
        backgroundColor: colorMap[b.status] || "#6b7280",
        borderColor: "transparent",
        textColor: "#fff",
        extendedProps: {
          status: b.status,
          customer: b.customers?.display_name || "",
          price: b.total_price || 0,
        },
      })
    })

    // Add day-off markers from availability
    availability.forEach(a => {
      if (a.slots.every(s => !s.available)) {
        events.push({
          id: `off-${a.date}`,
          title: "DAY OFF",
          start: a.date,
          end: a.date,
          backgroundColor: "rgba(239,68,68,0.15)",
          borderColor: "#ef4444",
          textColor: "#ef4444",
          extendedProps: { status: "off", customer: "", price: 0 },
        })
      }
    })

    return events
  }, [bookings, availability])

  // Next 14 days for quick date picking
  const next14Days = useMemo(() => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      days.push(d.toISOString().split("T")[0])
    }
    return days
  }, [])

  const isDayOff = (date: string) => {
    const existing = availability.find(a => a.date === date)
    return existing ? existing.slots.every(s => !s.available) : false
  }

  const hasBookingOnDate = (date: string) => bookings.some(b => b.booking_date === date)

  return (
    <div className="p-4 lg:p-8 animate-page-enter">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Calendar</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--text-secondary))" }}>
            Manage your bookings and availability
          </p>
        </div>
        <div className="flex gap-2">
          {view === "availability" && (
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "#22c55e" }}
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8l3 3 7-7"/></svg>
              )}
              Save &amp; Sync
            </button>
          )}
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
        {(["calendar", "availability", "schedule"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${view === v ? "gradient-accent text-white shadow-lg" : ""}`}
            style={view !== v ? { color: "hsl(var(--text-secondary))" } : undefined}
          >
            {v}
          </button>
        ))}
      </div>

      {/* ═══ CALENDAR VIEW ═══ */}
      {view === "calendar" && (
        <div className="card-glass p-4 sm:p-6">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-white/20 border-t-white/80 rounded-full animate-spin" style={{ borderColor: "var(--glass-border)", borderTopColor: "var(--accent-hex)" }} />
                <span className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>Loading calendar...</span>
              </div>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={calendarEvents}
              slotMinTime="11:00:00"
              slotMaxTime="23:00:00"
              allDaySlot={true}
              nowIndicator
              height="auto"
              eventContent={(arg: { event: { title: string; extendedProps: { customer: string; price: number } }; timeText: string }) => (
                <div className="p-1 text-xs overflow-hidden">
                  <div className="font-bold truncate">{arg.event.title}</div>
                  {arg.event.extendedProps.customer && (
                    <div className="opacity-75 truncate">{arg.event.extendedProps.customer}</div>
                  )}
                  {arg.timeText && <div className="opacity-60">{arg.timeText}</div>}
                </div>
              )}
              dateClick={(info: { dateStr: string }) => {
                if (info.dateStr.length === 10) {
                  setSelectedDate(info.dateStr)
                  setView("availability")
                }
              }}
            />
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
            {[
              { label: "Pending", color: "#f59e0b" },
              { label: "Confirmed", color: "var(--accent-hex)" },
              { label: "Completed", color: "#22c55e" },
              { label: "Day Off", color: "#ef4444" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ AVAILABILITY VIEW — Interactive slot picker ═══ */}
      {view === "availability" && (
        <div className="space-y-6">
          {/* Date selector — horizontal scroll */}
          <div className="card-glass p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--text-muted))" }}>Select Date</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {next14Days.map(date => {
                const d = new Date(date + "T12:00:00")
                const isSelected = date === selectedDate
                const isOff = isDayOff(date)
                const hasBooking = hasBookingOnDate(date)
                const isToday = date === new Date().toISOString().split("T")[0]
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all ${
                      isSelected ? "gradient-accent text-white shadow-lg scale-105" : "hover:scale-[1.03]"
                    }`}
                    style={!isSelected ? {
                      background: isOff ? "rgba(239,68,68,0.1)" : "var(--glass-bg)",
                      border: `1px solid ${isOff ? "rgba(239,68,68,0.3)" : isToday ? "var(--accent-hex)" : "var(--glass-border)"}`,
                      color: isOff ? "#ef4444" : "hsl(var(--text-primary))",
                    } : undefined}
                  >
                    <p className="text-[10px] uppercase font-semibold" style={!isSelected ? { color: "hsl(var(--text-muted))" } : undefined}>
                      {d.toLocaleDateString("en-GB", { weekday: "short" })}
                    </p>
                    <p className="text-lg font-bold">{d.getDate()}</p>
                    <p className="text-[10px]" style={!isSelected ? { color: "hsl(var(--text-muted))" } : undefined}>
                      {d.toLocaleDateString("en-GB", { month: "short" })}
                    </p>
                    {hasBooking && !isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: "var(--accent-hex)" }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time slots grid */}
          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: "hsl(var(--text-primary))" }}>
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                  {selectedDaySlots.filter(s => s.available).length} of {selectedDaySlots.length} slots available
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Set all slots available
                    setAvailability(prev => {
                      const filtered = prev.filter(a => a.date !== selectedDate)
                      return [...filtered, { date: selectedDate, slots: selectedDaySlots.map(s => ({ ...s, available: true })) }]
                    })
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
                >
                  All On
                </button>
                <button
                  onClick={() => toggleDayOff(selectedDate)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02]"
                  style={{
                    background: isDayOff(selectedDate) ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    color: isDayOff(selectedDate) ? "#22c55e" : "#ef4444",
                    border: `1px solid ${isDayOff(selectedDate) ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}
                >
                  {isDayOff(selectedDate) ? "Reopen Day" : "Day Off"}
                </button>
              </div>
            </div>

            {selectedDaySlots.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2">🌙</p>
                <p className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>Day Off</p>
                <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                  This day is not scheduled for work
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {selectedDaySlots.map(slot => {
                  const hasBookingAtTime = bookings.some(b => b.booking_date === selectedDate && b.booking_time === slot.time)
                  return (
                    <button
                      key={slot.time}
                      onClick={() => !hasBookingAtTime && toggleSlot(slot.time)}
                      disabled={hasBookingAtTime}
                      className={`py-3 px-2 rounded-xl text-sm font-semibold text-center transition-all ${
                        hasBookingAtTime
                          ? "cursor-not-allowed"
                          : slot.available
                            ? "hover:scale-[1.03] active:scale-[0.97]"
                            : "hover:scale-[1.03] active:scale-[0.97]"
                      }`}
                      style={
                        hasBookingAtTime
                          ? { background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "2px solid rgba(139,92,246,0.4)" }
                          : slot.available
                            ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "2px solid rgba(34,197,94,0.3)" }
                            : { background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "2px solid rgba(239,68,68,0.2)", opacity: 0.6 }
                      }
                    >
                      {slot.time}
                      <div className="text-[10px] mt-0.5 font-normal">
                        {hasBookingAtTime ? "Booked" : slot.available ? "Open" : "Closed"}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bookings for this date */}
          {bookings.filter(b => b.booking_date === selectedDate).length > 0 && (
            <div className="card-glass p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--text-muted))" }}>
                Bookings on this day
              </h3>
              <div className="space-y-2">
                {bookings.filter(b => b.booking_date === selectedDate).map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--surface-2-hex)", border: "1px solid var(--glass-border)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full" style={{ background: b.status === "confirmed" ? "var(--accent-hex)" : b.status === "completed" ? "#22c55e" : "#f59e0b" }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
                          {b.services?.name || "Booking"}
                        </p>
                        <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                          {b.booking_time} &middot; {b.customers?.display_name || "Customer"} &middot; {b.duration_minutes || b.services?.duration || 60}min
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: "var(--accent-hex)" }}>
                        &pound;{b.total_price?.toFixed(2) || "—"}
                      </p>
                      <p className="text-[10px] uppercase font-bold" style={{
                        color: b.status === "confirmed" ? "var(--accent-hex)" : b.status === "completed" ? "#22c55e" : "#f59e0b"
                      }}>{b.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ SCHEDULE VIEW — Weekly working hours ═══ */}
      {view === "schedule" && (
        <div className="space-y-6">
          <div className="card-glass p-6">
            <h2 className="text-lg font-bold mb-1" style={{ color: "hsl(var(--text-primary))" }}>Working Hours</h2>
            <p className="text-xs mb-5" style={{ color: "hsl(var(--text-muted))" }}>Set your default weekly schedule. Toggle days on/off.</p>
            <div className="space-y-3">
              {DAYS.map(day => {
                const h = workingHours[day] || { enabled: true, start: "11:00", end: "23:00" }
                return (
                  <div key={day} className="flex items-center gap-4 p-3 rounded-xl transition-all" style={{ background: h.enabled ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)", border: `1px solid ${h.enabled ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                    {/* Toggle */}
                    <button
                      onClick={() => saveWorkingHours({ ...workingHours, [day]: { ...h, enabled: !h.enabled } })}
                      className={`w-12 h-7 rounded-full transition-all relative flex-shrink-0 ${h.enabled ? "" : ""}`}
                      style={{ background: h.enabled ? "#22c55e" : "var(--surface-2-hex)" }}
                    >
                      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${h.enabled ? "left-6" : "left-1"}`} />
                    </button>

                    {/* Day name */}
                    <span className={`w-24 text-sm font-semibold ${h.enabled ? "" : "line-through opacity-40"}`} style={{ color: "hsl(var(--text-primary))" }}>
                      {day}
                    </span>

                    {/* Time inputs */}
                    <div className={`flex items-center gap-2 flex-1 ${h.enabled ? "" : "opacity-20 pointer-events-none"}`}>
                      <input
                        type="time"
                        value={h.start}
                        onChange={e => saveWorkingHours({ ...workingHours, [day]: { ...h, start: e.target.value } })}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                      />
                      <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>to</span>
                      <input
                        type="time"
                        value={h.end}
                        onChange={e => saveWorkingHours({ ...workingHours, [day]: { ...h, end: e.target.value } })}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                      />
                    </div>

                    {/* Hours count */}
                    <span className="text-xs font-medium hidden sm:block" style={{ color: h.enabled ? "#22c55e" : "hsl(var(--text-muted))" }}>
                      {h.enabled ? `${parseInt(h.end) - parseInt(h.start)}h` : "Off"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card-glass p-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: "hsl(var(--text-primary))" }}>Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const allEnabled = Object.fromEntries(DAYS.map(d => [d, { enabled: true, start: "11:00", end: "23:00" }]))
                  saveWorkingHours(allEnabled)
                  showToast("All days set to 11am-11pm")
                }}
                className="p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
              >
                <p className="font-semibold text-sm" style={{ color: "hsl(var(--text-primary))" }}>Open All Week</p>
                <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Set every day to 11am - 11pm</p>
              </button>
              <button
                onClick={() => {
                  const weekdaysOnly = Object.fromEntries(DAYS.map(d => [d, { enabled: !["Saturday", "Sunday"].includes(d), start: "11:00", end: "23:00" }]))
                  saveWorkingHours(weekdaysOnly)
                  showToast("Weekdays only — weekends off")
                }}
                className="p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
              >
                <p className="font-semibold text-sm" style={{ color: "hsl(var(--text-primary))" }}>Weekdays Only</p>
                <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Mon-Fri open, weekends off</p>
              </button>
              <button
                onClick={() => {
                  const weekendOnly = Object.fromEntries(DAYS.map(d => [d, { enabled: ["Saturday", "Sunday"].includes(d), start: "11:00", end: "23:00" }]))
                  saveWorkingHours(weekendOnly)
                  showToast("Weekends only")
                }}
                className="p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
              >
                <p className="font-semibold text-sm" style={{ color: "hsl(var(--text-primary))" }}>Weekends Only</p>
                <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Sat-Sun open, weekdays off</p>
              </button>
              <button
                onClick={saveAvailability}
                disabled={saving}
                className="p-4 rounded-xl text-left transition-all hover:scale-[1.01] disabled:opacity-50"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <p className="font-semibold text-sm" style={{ color: "#22c55e" }}>
                  {saving ? "Syncing..." : "Sync to Google Calendar"}
                </p>
                <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Push availability to n8n &amp; Google Calendar</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
