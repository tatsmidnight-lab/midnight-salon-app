"use client"

import { useState, useEffect, useMemo } from "react"

interface BookingCalendarProps {
  artistId: string
  duration: number // minutes
  onSelect: (date: string, time: string) => void
}

const SLOT_START = 11 // 11 AM
const SLOT_END = 23   // 11 PM

function generateTimeSlots(duration: number): string[] {
  const slots: string[] = []
  for (let h = SLOT_START; h < SLOT_END; h++) {
    for (let m = 0; m < 60; m += duration >= 60 ? 60 : duration < 30 ? 15 : 30) {
      const endH = h + Math.floor((m + duration) / 60)
      const endM = (m + duration) % 60
      if (endH > SLOT_END || (endH === SLOT_END && endM > 0)) break
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }
  }
  return slots
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function BookingCalendar({ artistId, duration, onSelect }: BookingCalendarProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const timeSlots = useMemo(() => generateTimeSlots(duration), [duration])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth)

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  // Fetch booked slots when date selected
  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    fetch(`/api/bookings/get-artist-availability?artist_id=${artistId}&date=${selectedDate}`)
      .then((r) => r.ok ? r.json() : { booked: [] })
      .then((data) => setBookedSlots(data.booked || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, artistId])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="card-glass p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-primary))" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 4L6 8l4 4" />
            </svg>
          </button>
          <h3 className="text-lg font-bold" style={{ color: "hsl(var(--text-primary))" }}>
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-primary))" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: "hsl(var(--text-muted))" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const isPast = dateStr < todayStr
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === todayStr

            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => setSelectedDate(dateStr)}
                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  isPast ? "opacity-30 cursor-not-allowed" : "hover:scale-110"
                } ${isSelected ? "gradient-accent text-white shadow-lg" : ""}`}
                style={
                  !isSelected && !isPast
                    ? {
                        color: isToday ? "var(--accent-hex)" : "hsl(var(--text-primary))",
                        border: isToday ? "1px solid var(--accent-hex)" : undefined,
                        borderRadius: "0.75rem",
                      }
                    : undefined
                }
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="card-glass p-6 animate-page-enter">
          <h3 className="text-lg font-bold mb-4" style={{ color: "hsl(var(--text-primary))" }}>
            Available Times — {new Date(selectedDate + "T00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </h3>

          {loadingSlots ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "var(--surface-2-hex)" }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot)
                return (
                  <button
                    key={slot}
                    disabled={isBooked}
                    onClick={() => onSelect(selectedDate, slot)}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isBooked
                        ? "opacity-30 cursor-not-allowed line-through"
                        : "hover:scale-105"
                    }`}
                    style={
                      !isBooked
                        ? {
                            background: "var(--glass-bg)",
                            border: "1px solid var(--glass-border)",
                            color: "hsl(var(--text-primary))",
                          }
                        : {
                            background: "var(--surface-2-hex)",
                            color: "hsl(var(--text-muted))",
                          }
                    }
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
