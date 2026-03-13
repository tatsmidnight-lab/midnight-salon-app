/* eslint-disable @next/next/no-img-element */

export function Logo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <img
      src="/logo.jpg"
      alt="Midnight Tattoo Studio"
      className={`object-contain ${className}`}
    />
  )
}

export function LogoFull({ className = 'h-20' }: { className?: string }) {
  return (
    <img
      src="/logo.jpg"
      alt="Midnight Tattoo Studio"
      className={`object-contain ${className}`}
    />
  )
}

export function LogoText({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold text-xl tracking-tight ${className}`}>
      <span className="text-white">Midnight</span>
      <span className="text-cyan-400"> Tattoo</span>
    </span>
  )
}
