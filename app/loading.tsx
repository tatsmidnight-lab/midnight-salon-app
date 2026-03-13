export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-page-enter">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.jpg"
        alt=""
        className="w-14 h-14 rounded-full animate-pulse"
      />
      <div className="mt-4 w-24 h-[2px] rounded-full overflow-hidden" style={{ background: "var(--glass-border)" }}>
        <div className="h-full gradient-accent rounded-full animate-loader-bar" />
      </div>
    </div>
  )
}
