"use client"

interface GeometricBgProps {
  variant?: "default" | "piercing" | "tattoo" | "eyelash" | "grid"
  className?: string
}

export default function GeometricBg({ variant = "default", className = "" }: GeometricBgProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {variant === "piercing" && (
            <pattern id="geo-piercing" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <polygon points="30,0 60,30 30,60 0,30" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="60" y2="60" stroke="currentColor" strokeWidth="0.3" />
              <line x1="60" y1="0" x2="0" y2="60" stroke="currentColor" strokeWidth="0.3" />
            </pattern>
          )}
          {variant === "tattoo" && (
            <pattern id="geo-tattoo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="0.3" />
              <path d="M10,40 Q25,10 40,40 Q55,70 70,40" fill="none" stroke="currentColor" strokeWidth="0.4" />
            </pattern>
          )}
          {variant === "eyelash" && (
            <pattern id="geo-eyelash" x="0" y="0" width="70" height="70" patternUnits="userSpaceOnUse">
              <path d="M0,35 Q17.5,5 35,35 Q52.5,65 70,35" fill="none" stroke="currentColor" strokeWidth="0.4" />
              <path d="M0,50 Q17.5,20 35,50 Q52.5,80 70,50" fill="none" stroke="currentColor" strokeWidth="0.3" />
              <circle cx="35" cy="35" r="3" fill="none" stroke="currentColor" strokeWidth="0.3" />
            </pattern>
          )}
          {variant === "grid" && (
            <pattern id="geo-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.3" />
              <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.5" />
            </pattern>
          )}
          {variant === "default" && (
            <pattern id="geo-default" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <polygon points="50,10 90,35 90,75 50,100 10,75 10,35" fill="none" stroke="currentColor" strokeWidth="0.4" />
              <circle cx="50" cy="55" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
            </pattern>
          )}
        </defs>
        <rect width="100%" height="100%" fill={`url(#geo-${variant})`} />
      </svg>
      {/* Gradient fade edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-hex)] via-transparent to-[var(--bg-hex)]" />
    </div>
  )
}
