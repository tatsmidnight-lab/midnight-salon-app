"use client"

import { useTheme } from "@/app/providers/ThemeProvider"

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme()

  return (
    <button
      onClick={toggleMode}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        color: "hsl(var(--text-secondary))",
      }}
      aria-label={`Theme: ${mode}`}
      title={`Theme: ${mode} (click to cycle)`}
    >
      {mode === "auto" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
        </svg>
      )}
      {mode === "light" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="4" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
        </svg>
      )}
      {mode === "dark" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5 4 4 0 0 0 13.5 8Z" />
        </svg>
      )}
    </button>
  )
}
