"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface VideoCarouselProps {
  videos: string[]
  interval?: number
}

export default function VideoCarousel({ videos, interval = 8000 }: VideoCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [next, setNext] = useState(1)
  const [transitioning, setTransitioning] = useState(false)
  const currentRef = useRef<HTMLVideoElement>(null)
  const nextRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const advance = useCallback(() => {
    if (videos.length <= 1) return
    const nextIdx = (current + 1) % videos.length
    const afterNext = (nextIdx + 1) % videos.length

    setNext(nextIdx)
    setTransitioning(true)

    setTimeout(() => {
      setCurrent(nextIdx)
      setNext(afterNext)
      setTransitioning(false)
    }, 1200) // crossfade duration
  }, [current, videos.length])

  useEffect(() => {
    timerRef.current = setInterval(advance, interval)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [advance, interval])

  // Preload next video
  useEffect(() => {
    if (nextRef.current) {
      nextRef.current.load()
    }
  }, [next])

  if (videos.length === 0) {
    return (
      <div className="absolute inset-0" style={{ background: "var(--bg-hex)" }}>
        {/* Placeholder gradient when no videos */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden video-carousel">
      {/* Current video */}
      <video
        ref={currentRef}
        src={videos[current]}
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Next video (preloaded, fades in during transition) */}
      {videos.length > 1 && (
        <video
          ref={nextRef}
          src={videos[next]}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ${
            transitioning ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

      {/* Geometric SVG overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-geo" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <polygon points="60,10 110,35 110,85 60,110 10,85 10,35" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="60" cy="60" r="25" fill="none" stroke="white" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-geo)" />
      </svg>

      {/* Video indicator dots */}
      {videos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrent(i)
                setNext((i + 1) % videos.length)
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 opacity-100"
                  : "opacity-40 hover:opacity-70"
              }`}
              style={{
                background: i === current ? "var(--accent-hex)" : "white",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
