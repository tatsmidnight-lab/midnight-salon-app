export default function SectionLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-page-enter">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.jpg"
        alt=""
        className="w-12 h-12 rounded-full animate-pulse"
      />
      <p className="mt-4 text-white/20 text-sm tracking-wider">{text}</p>
    </div>
  )
}
