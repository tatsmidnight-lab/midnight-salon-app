"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"

// Dynamically import FullCalendar to avoid SSR issues
const FullCalendar = dynamic(
  () => import("@fullcalendar/react").then((m) => m.default),
  { ssr: false }
)

import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

type Booking = {
  id: string; date: string; time: string; status: string
  services?: { name: string; duration: number }
}

type WorkingHours = {
  [day: string]: { enabled: boolean; start: string; end: string }
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const DEFAULT_HOURS: WorkingHours = Object.fromEntries(
  DAYS.map((d) => [d, { enabled: true, start: "11:00", end: "23:00" }])
)

export default function ArtistCalendarPage() {
  const [view, setView] = useState<"calendar" | "schedule">("calendar")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [daysOff, setDaysOff] = useState<string[]>([])
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_HOURS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load saved settings
    try {
      const savedHours = localStorage.getItem("midnight_working_hours")
      if (savedHours) setWorkingHours(JSON.parse(savedHours))
      const savedOff = localStorage.getItem("midnight_days_off")
      if (savedOff) setDaysOff(JSON.parse(savedOff))
    } catch {}

    // Fetch bookings
    fetch(`/api/bookings/get-artist-bookings?date=${new Date().toISOString().split("T")[0]}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveHours = useCallback((hours: WorkingHours) => {
    setWorkingHours(hours)
    localStorage.setItem("midnight_working_hours", JSON.stringify(hours))
  }, [])

  const toggleDayOff = useCallback((dateStr: string) => {
    setDaysOff((prev) => {
      const next = prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
      localStorage.setItem("midnight_days_off", JSON.stringify(next))
      return next
    })
  }, [])

  const calendarEvents = bookings.map((b) => ({
    id: b.id,
    title: b.services?.name || "Booking",
    start: `${b.date}T${b.time}`,
    end: b.services?.duration
      ? new Date(new Date(`${b.date}T${b.time}`).getTime() + b.services.duration * 60000).toISOString()
      : undefined,
    backgroundColor: b.status === "confirmed" ? "var(--accent-hex)" : b.status === "completed" ? "#22c55e" : "#6b7280",
    borderColor: "transparent",
  }))

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Calendar</h1>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === "calendar" ? "gradient-accent text-white" : ""}`}
            style={view !== "calendar" ? { color: "hsl(var(--text-secondary))" } : undefined}
          >
            Calendar
          </button>
          <button
            onClick={() => setView("schedule")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === "schedule" ? "gradient-accent text-white" : ""}`}
            style={view !== "schedule" ? { color: "hsl(var(--text-secondary))" } : undefined}
          >
            Schedule
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="card-glass p-4 sm:p-6">
          {loading ? (
            <div className="h-96 flex items-center justify-center animate-pulse" style={{ color: "hsl(var(--text-muted))" }}>
              Loading calendar...
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
              allDaySlot={false}
              nowIndicator
              height="auto"
              dateClick={(info: { dateStr: string }) => {
                if (info.dateStr.length === 10) {
                  toggleDayOff(info.dateStr)
                }
              }}
            />
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-page-enter">
          {/* Working hours */}
          <div className="card-glass p-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: "hsl(var(--text-primary))" }}>Working Hours</h2>
            <div className="space-y-3">
              {DAYS.map((day) => {
                const h = workingHours[day] || { enabled: true, start: "11:00", end: "23:00" }
                return (
                  <div key={day} className="flex items-center gap-4 flex-wrap">
                    <button
                      onClick={() => saveHours({ ...workingHours, [day]: { ...h, enabled: !h.enabled } })}
                      className={`w-28 text-left text-sm font-semibold transition-opacity ${h.enabled ? "" : "opacity-40 line-through"}`}
                      style={{ color: "hsl(var(--text-primary))" }}
                    >
                      {day}
                    </button>
                    <div className={`flex items-center gap-2 ${h.enabled ? "" : "opacity-30 pointer-events-none"}`}>
                      <input
                        type="time"
                        value={h.start}
                        onChange={(e) => saveHours({ ...workingHours, [day]: { ...h, start: e.target.value } })}
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                      />
                      <span style={{ color: "hsl(var(--text-muted))" }}>—</span>
                      <input
                        type="time"
                        value={h.end}
                        onChange={(e) => saveHours({ ...workingHours, [day]: { ...h, end: e.target.value } })}
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                      />
                    </div>
                    <button
                      onClick={() => saveHours({ ...workingHours, [day]: { ...h, enabled: !h.enabled } })}
                      className={`w-10 h-6 rounded-full transition-all relative ${h.enabled ? "gradient-accent" : ""}`}
                      style={!h.enabled ? { background: "var(--surface-2-hex)" } : undefined}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${h.enabled ? "left-5" : "left-1"}`} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Days off */}
          <div className="card-glass p-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: "hsl(var(--text-primary))" }}>Days Off</h2>
            {daysOff.length === 0 ? (
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>
                No days off scheduled. Click a date in the calendar view to mark it off.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {daysOff.sort().map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDayOff(d)}
                    className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    {new Date(d + "T00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l8 8M11 3L3 11"/></svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
