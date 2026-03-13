"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "morning" | "afternoon" | "evening" | "midnight"
type ThemeMode = "auto" | "light" | "dark"

interface ThemeContextType {
  theme: Theme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "midnight",
  mode: "auto",
  setMode: () => {},
  toggleMode: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function getAutoTheme(): Theme {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 21) return "evening"
  return "midnight"
}

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === "auto") return getAutoTheme()
  if (mode === "light") return "afternoon"
  return "midnight"
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("auto")
  const [theme, setTheme] = useState<Theme>("midnight")

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
    localStorage.setItem("midnight_theme_mode", m)
    setTheme(resolveTheme(m))
  }, [])

  const toggleMode = useCallback(() => {
    const modes: ThemeMode[] = ["auto", "light", "dark"]
    const idx = modes.indexOf(mode)
    setMode(modes[(idx + 1) % modes.length])
  }, [mode, setMode])

  useEffect(() => {
    const saved = localStorage.getItem("midnight_theme_mode") as ThemeMode | null
    if (saved) {
      setModeState(saved)
      setTheme(resolveTheme(saved))
    } else {
      setTheme(getAutoTheme())
    }
  }, [])

  // Auto-update theme every minute when in auto mode
  useEffect(() => {
    if (mode !== "auto") return
    const interval = setInterval(() => {
      setTheme(getAutoTheme())
    }, 60000)
    return () => clearInterval(interval)
  }, [mode])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
