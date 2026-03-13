'use client'

import MidnightLogo from './MidnightLogo'

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a1a] flex flex-col items-center justify-center">
      <MidnightLogo animate size={100} />
      {/* Loading bar */}
      <div className="mt-8 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-loader-bar" />
      </div>
    </div>
  )
}
