'use client'

import { useEffect, useState } from 'react'

interface HeroSliderProps {
  images: string[]
  interval?: number
}

export default function HeroSlider({ images, interval = 5000 }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, interval)
    return () => clearInterval(timer)
  }, [images.length, interval])

  return (
    <div className="absolute inset-0">
      {images.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out bg-cover bg-center"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === current ? 1 : 0,
            transform: i === current ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 2s ease-in-out, transform 8s ease-out',
          }}
        />
      ))}
    </div>
  )
}
