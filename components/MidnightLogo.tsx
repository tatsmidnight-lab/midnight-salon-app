'use client'

interface MidnightLogoProps {
  className?: string
  animate?: boolean
  size?: number
}

/**
 * SVG recreation of the MidNight Tattoo goat/ram logo.
 * Blue line art on transparent background, with optional draw-in animation.
 */
export default function MidnightLogo({ className = '', animate = false, size = 120 }: MidnightLogoProps) {
  return (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size * 1.2}
    >
      <defs>
        <linearGradient id="logo-blue" x1="50" y1="0" x2="150" y2="200">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        {animate && (
          <style>{`
            .logo-path {
              stroke-dasharray: 1200;
              stroke-dashoffset: 1200;
              animation: logo-draw 2.5s ease-out forwards;
            }
            .logo-path-delay {
              stroke-dasharray: 800;
              stroke-dashoffset: 800;
              animation: logo-draw-d 2s ease-out 0.5s forwards;
            }
            .logo-star {
              opacity: 0;
              animation: logo-star-in 0.6s ease-out 2s forwards;
            }
            .logo-glow {
              opacity: 0;
              animation: logo-glow-pulse 2s ease-in-out 2.2s infinite;
            }
            @keyframes logo-draw {
              to { stroke-dashoffset: 0; }
            }
            @keyframes logo-draw-d {
              to { stroke-dashoffset: 0; }
            }
            @keyframes logo-star-in {
              from { opacity: 0; transform: scale(0.5); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes logo-glow-pulse {
              0%, 100% { opacity: 0.15; }
              50% { opacity: 0.4; }
            }
          `}</style>
        )}
      </defs>

      {/* Glow effect behind the head */}
      <circle
        cx="100" cy="95" r="50"
        fill="url(#logo-blue)"
        className={animate ? 'logo-glow' : ''}
        opacity={animate ? 0 : 0.08}
      />

      {/* Left horn */}
      <path
        d="M75 75 Q60 40 55 10 Q52 25 58 45 Q62 58 70 70"
        stroke="url(#logo-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        className={animate ? 'logo-path' : ''}
      />
      {/* Left horn inner detail */}
      <path
        d="M72 68 Q62 45 60 20"
        stroke="url(#logo-blue)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
        className={animate ? 'logo-path-delay' : ''}
      />

      {/* Right horn */}
      <path
        d="M125 75 Q140 40 145 10 Q148 25 142 45 Q138 58 130 70"
        stroke="url(#logo-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        className={animate ? 'logo-path' : ''}
      />
      {/* Right horn inner detail */}
      <path
        d="M128 68 Q138 45 140 20"
        stroke="url(#logo-blue)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
        className={animate ? 'logo-path-delay' : ''}
      />

      {/* Crown/top ornament */}
      <path
        d="M85 62 L90 52 L95 58 L100 48 L105 58 L110 52 L115 62"
        stroke="url(#logo-blue)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? 'logo-path-delay' : ''}
      />

      {/* Head outline - left */}
      <path
        d="M70 75 Q65 85 68 100 Q70 110 75 118 Q80 125 85 130"
        stroke="url(#logo-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        className={animate ? 'logo-path' : ''}
      />

      {/* Head outline - right */}
      <path
        d="M130 75 Q135 85 132 100 Q130 110 125 118 Q120 125 115 130"
        stroke="url(#logo-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        className={animate ? 'logo-path' : ''}
      />

      {/* Forehead */}
      <path
        d="M75 75 Q85 65 100 62 Q115 65 125 75"
        stroke="url(#logo-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        className={animate ? 'logo-path' : ''}
      />

      {/* Eyes */}
      <ellipse cx="85" cy="92" rx="6" ry="4"
        stroke="url(#logo-blue)" strokeWidth="1.5"
        className={animate ? 'logo-path-delay' : ''}
      />
      <ellipse cx="115" cy="92" rx="6" ry="4"
        stroke="url(#logo-blue)" strokeWidth="1.5"
        className={animate ? 'logo-path-delay' : ''}
      />

      {/* Star on forehead */}
      <path
        d="M100 76 L101.5 80 L106 80.5 L103 83 L104 87 L100 85 L96 87 L97 83 L94 80.5 L98.5 80Z"
        stroke="url(#logo-blue)"
        strokeWidth="1"
        fill="url(#logo-blue)"
        fillOpacity="0.3"
        className={animate ? 'logo-star' : ''}
      />

      {/* Nose bridge */}
      <path
        d="M97 98 L100 108 L103 98"
        stroke="url(#logo-blue)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? 'logo-path-delay' : ''}
      />

      {/* Nostrils */}
      <circle cx="93" cy="112" r="3" stroke="url(#logo-blue)" strokeWidth="1"
        className={animate ? 'logo-path-delay' : ''} />
      <circle cx="107" cy="112" r="3" stroke="url(#logo-blue)" strokeWidth="1"
        className={animate ? 'logo-path-delay' : ''} />

      {/* Mouth */}
      <path
        d="M90 120 Q95 125 100 123 Q105 125 110 120"
        stroke="url(#logo-blue)"
        strokeWidth="1.5"
        strokeLinecap="round"
        className={animate ? 'logo-path-delay' : ''}
      />

      {/* Chin / jaw */}
      <path
        d="M85 130 Q90 138 100 140 Q110 138 115 130"
        stroke="url(#logo-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        className={animate ? 'logo-path' : ''}
      />

      {/* Beard / chin dots */}
      <path
        d="M95 135 L95 142 M100 136 L100 145 M105 135 L105 142"
        stroke="url(#logo-blue)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
        className={animate ? 'logo-path-delay' : ''}
      />

      {/* Facial decorative lines */}
      <path
        d="M75 95 Q80 100 82 108"
        stroke="url(#logo-blue)" strokeWidth="1" opacity="0.4"
        strokeLinecap="round"
        className={animate ? 'logo-path-delay' : ''}
      />
      <path
        d="M125 95 Q120 100 118 108"
        stroke="url(#logo-blue)" strokeWidth="1" opacity="0.4"
        strokeLinecap="round"
        className={animate ? 'logo-path-delay' : ''}
      />

      {/* MIDNIGHT text */}
      <text
        x="100" y="175"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        fontSize="24"
        letterSpacing="6"
        fill="white"
        opacity={animate ? 0 : 1}
        className={animate ? 'logo-star' : ''}
      >
        MIDNIGHT
      </text>

      {/* TATTOO STUDIO subtitle */}
      <text
        x="100" y="195"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="300"
        fontSize="10"
        letterSpacing="8"
        fill="url(#logo-blue)"
        opacity={animate ? 0 : 0.7}
        className={animate ? 'logo-star' : ''}
      >
        TATTOO STUDIO
      </text>
    </svg>
  )
}
