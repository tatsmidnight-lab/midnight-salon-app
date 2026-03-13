"use client"

import Link from "next/link"
import VideoCarousel from "@/components/VideoCarousel"
import GeometricBg from "@/components/GeometricBg"
import { useEffect, useState } from "react"

const HERO_VIDEOS = [
  "/videos/IMG_5236.MOV",
  "/videos/IMG_3815.MOV",
  "/videos/IMG_5030.MOV",
  "/videos/IMG_5257.MOV",
  "/videos/IMG_5269.MOV",
]

// Portfolio photos for the Instagram grid
const PORTFOLIO_PHOTOS = [
  "/videos/photo_1_2026-03-13_12-03-02.jpg",
  "/videos/photo_2_2026-03-13_12-03-02.jpg",
  "/videos/photo_3_2026-03-13_12-03-02.jpg",
  "/videos/photo_4_2026-03-13_12-03-02.jpg",
  "/videos/photo_5_2026-03-13_12-03-02.jpg",
  "/videos/photo_6_2026-03-13_12-03-02.jpg",
  "/videos/photo_7_2026-03-13_12-03-02.jpg",
  "/videos/photo_8_2026-03-13_12-03-02.jpg",
  "/videos/photo_9_2026-03-13_12-03-02.jpg",
]

const REVIEWS = [
  {
    name: "Sarah M.",
    text: "Absolutely incredible work. The attention to detail is unmatched. My tattoo is everything I dreamed of and more.",
    rating: 5,
    video: "/videos/IMG_5236.MOV",
    service: "Custom Tattoo",
  },
  {
    name: "James K.",
    text: "Best piercing experience I've ever had. Clean, professional, and the aftercare advice was spot on.",
    rating: 5,
    video: "/videos/IMG_3815.MOV",
    service: "Nose Piercing",
  },
  {
    name: "Luna P.",
    text: "The eyelash extensions look so natural! I've been coming back for months now. Wouldn't go anywhere else.",
    rating: 5,
    video: "/videos/IMG_5030.MOV",
    service: "Eyelash Extensions",
  },
  {
    name: "Alex D.",
    text: "From the moment I walked in, I felt welcomed. The artists really listen to what you want. Highly recommend Midnight!",
    rating: 5,
    video: "/videos/IMG_5257.MOV",
    service: "Fine Line Tattoo",
  },
  {
    name: "Chloe R.",
    text: "My septum piercing healed perfectly thanks to their incredible aftercare kit. The studio is immaculate.",
    rating: 5,
    video: "/videos/IMG_4937.MOV",
    service: "Septum Piercing",
  },
  {
    name: "Marcus T.",
    text: "Got a full sleeve done over several sessions. Every single session was a vibe. True artists at work.",
    rating: 5,
    video: "/videos/IMG_5269.MOV",
    service: "Full Sleeve Tattoo",
  },
  {
    name: "Priya N.",
    text: "The micropigmentation was life-changing. Looks so natural and the artist made me feel totally at ease.",
    rating: 5,
    video: "/videos/IMG_4301.MOV",
    service: "Lip Blush",
  },
  {
    name: "Danny O.",
    text: "Second tattoo here and it won't be my last. The designs they come up with are next level creative.",
    rating: 5,
    video: "/videos/IMG_5166.MOV",
    service: "Midsize Tattoo",
  },
]

// Showcase videos for the work reel
const SHOWCASE_VIDEOS = [
  "/videos/IMG_5235.MOV",
  "/videos/IMG_4976.MOV",
  "/videos/IMG_4348.MOV",
  "/videos/IMG_5215.MOV",
  "/videos/IMG_5231.MOV",
  "/videos/IMG_5276.MOV",
]

const FEATURED_SERVICES = [
  { name: "Custom Tattoo", desc: "Bespoke designs tailored to your vision", icon: "tattoo" as const },
  { name: "Body Piercing", desc: "Professional piercing with premium jewellery", icon: "piercing" as const },
  { name: "Eyelash Extensions", desc: "Natural and glamorous lash styles", icon: "eyelash" as const },
]

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--accent-hex)">
      <path d="M7 0l1.76 4.83H14l-4.24 3.18L11.29 13 7 9.82 2.71 13l1.53-4.99L0 4.83h5.24z" />
    </svg>
  )
}

function ServiceIcon({ type }: { type: "tattoo" | "piercing" | "eyelash" }) {
  if (type === "tattoo") {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M16 4v24M10 8c3-2 6 2 6 2s3-4 6-2" />
        <circle cx="16" cy="16" r="4" />
        <path d="M8 20c4 4 12 4 16 0" />
      </svg>
    )
  }
  if (type === "piercing") {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="16" cy="12" r="4" />
        <path d="M16 16v8M12 28h8M14 20h4" />
      </svg>
    )
  }
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 16c0-4 4-8 10-8s10 4 10 8" />
      <path d="M8 16c0-2 3-5 8-5s8 3 8 5" />
      <path d="M4 18c2 4 6 6 12 6s10-2 12-6" />
    </svg>
  )
}

export default function HomePage() {
  const [reviewIdx, setReviewIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setReviewIdx((i) => (i + 1) % REVIEWS.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <VideoCarousel videos={HERO_VIDEOS} />

        <div className="relative z-10 text-center px-4 max-w-2xl">
          <a
            href="https://www.instagram.com/midnight.tats/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-6 text-white/60 text-sm tracking-[0.3em] uppercase hover:text-white/90 transition-colors"
          >
            Tattoo &middot; Piercing &middot; Eyelash &middot; Glasgow
          </a>

          <div className="space-y-4">
            <Link
              href="/services"
              className="btn-primary block text-center text-lg tracking-wide py-4 px-12 mx-auto max-w-xs"
            >
              BOOK NOW
            </Link>
            <Link
              href="/products"
              className="btn-secondary block text-center text-sm tracking-wide py-3 px-10 mx-auto max-w-xs text-white"
            >
              VISIT SHOP
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-float">
          <svg width="20" height="28" viewBox="0 0 20 28" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4">
            <rect x="1" y="1" width="18" height="26" rx="9" />
            <circle cx="10" cy="8" r="2" fill="white" opacity="0.6">
              <animate attributeName="cy" values="8;18;8" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <GeometricBg variant="default" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "hsl(var(--text-primary))" }}>
            Welcome to <span className="text-gradient">Midnight</span>
          </h2>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: "hsl(var(--text-secondary))" }}>
            A premium tattoo, piercing and eyelash studio in the heart of Glasgow.
            Our talented artists bring your vision to life with precision,
            creativity and care. Whether it&apos;s your first tattoo or your
            fiftieth, we make every visit special.
          </p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient">10+</div>
              <div className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Years Experience</div>
            </div>
            <div className="w-px h-12" style={{ background: "var(--glass-border)" }} />
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient">5K+</div>
              <div className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Happy Clients</div>
            </div>
            <div className="w-px h-12" style={{ background: "var(--glass-border)" }} />
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient">3</div>
              <div className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>Specialties</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED SERVICES ─── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <GeometricBg variant="grid" />
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ color: "hsl(var(--text-primary))" }}>
            Our Services
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 stagger-children">
            {FEATURED_SERVICES.map((svc) => (
              <Link key={svc.name} href="/services" className="card-glass p-8 text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "var(--glass-bg)" }}>
                  <ServiceIcon type={svc.icon} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>{svc.name}</h3>
                <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>{svc.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INSTAGRAM PORTFOLIO ─── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "hsl(var(--text-primary))" }}>Our Work</h2>
          <p className="mb-8" style={{ color: "hsl(var(--text-secondary))" }}>
            Follow us on Instagram for our latest pieces
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger-children">
            {PORTFOLIO_PHOTOS.slice(0, 9).map((photo, i) => (
              <a
                key={i}
                href="https://www.instagram.com/midnight.tats/"
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-xl overflow-hidden group relative"
                style={{ background: "var(--surface-hex)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Midnight Studio tattoo piercing portfolio piece ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
              </a>
            ))}
          </div>
          <a
            href="https://www.instagram.com/midnight.tats/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-8 text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ color: "var(--accent-hex)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            @midnight.tats — Follow us for more
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 12L12 4M12 4H6M12 4v6" />
            </svg>
          </a>
        </div>
      </section>

      {/* ─── VIDEO SHOWCASE ─── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <GeometricBg variant="tattoo" />
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ color: "hsl(var(--text-primary))" }}>
            Our Work in Motion
          </h2>
          <p className="text-center mb-10" style={{ color: "hsl(var(--text-secondary))" }}>
            Watch our artists create stunning pieces
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger-children">
            {SHOWCASE_VIDEOS.map((vid, i) => (
              <div key={i} className="aspect-[9/16] rounded-xl overflow-hidden relative group" style={{ background: "var(--surface-hex)" }}>
                <video
                  src={vid}
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                  onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseOut={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ color: "hsl(var(--text-primary))" }}>
            What Our Clients Say
          </h2>
          <p className="text-center mb-10" style={{ color: "hsl(var(--text-secondary))" }}>
            Real reviews from real clients, with video proof
          </p>

          {/* Featured review with video */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="aspect-[9/16] md:aspect-auto md:min-h-[400px] rounded-xl overflow-hidden relative" style={{ background: "var(--surface-hex)" }}>
              <video
                key={REVIEWS[reviewIdx].video}
                src={REVIEWS[reviewIdx].video}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
                  {REVIEWS[reviewIdx].service}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="card-glass p-8 sm:p-10">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: REVIEWS[reviewIdx].rating }).map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
                <p className="text-lg sm:text-xl leading-relaxed mb-6 italic" style={{ color: "hsl(var(--text-primary))" }}>
                  &ldquo;{REVIEWS[reviewIdx].text}&rdquo;
                </p>
                <div>
                  <p className="font-bold" style={{ color: "var(--accent-hex)" }}>{REVIEWS[reviewIdx].name}</p>
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>{REVIEWS[reviewIdx].service}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Review thumbnails */}
          <div className="flex justify-center gap-2 flex-wrap">
            {REVIEWS.map((r, i) => (
              <button
                key={i}
                onClick={() => setReviewIdx(i)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                  i === reviewIdx ? "gradient-accent text-white scale-105" : ""
                }`}
                style={
                  i !== reviewIdx
                    ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" }
                    : undefined
                }
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GIFT CARDS ─── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="card-glass p-12 sm:p-16" style={{ borderColor: "var(--accent-hex)", borderWidth: "1px" }}>
            <svg className="w-12 h-12 mx-auto mb-6" viewBox="0 0 48 48" fill="none" stroke="var(--accent-hex)" strokeWidth="1.5" strokeLinecap="round">
              <rect x="4" y="12" width="40" height="28" rx="4" />
              <path d="M4 20h40M24 12v28" />
              <path d="M24 12c-4-6-12-4-12 0s8 6 12 8M24 12c4-6 12-4 12 0s-8 6-12 8" />
            </svg>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "hsl(var(--text-primary))" }}>
              Gift Cards
            </h2>
            <p className="text-lg mb-8" style={{ color: "hsl(var(--text-secondary))" }}>
              Give the gift of ink, piercings or lashes. Perfect for any occasion.
            </p>
            <Link href="/gift-cards" className="btn-primary inline-block px-10">
              Shop Gift Cards
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <GeometricBg variant="grid" />
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ color: "hsl(var(--text-primary))" }}>
            Find Us
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card-glass p-8 space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--accent-hex)" }}>Address</h3>
                <p style={{ color: "hsl(var(--text-primary))" }}>Glasgow, Scotland</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--accent-hex)" }}>Phone</h3>
                <a href="tel:+447958747929" className="hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-primary))" }}>
                  07958 747929
                </a>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--accent-hex)" }}>Opening Hours</h3>
                <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>Monday – Sunday: 11:00 AM – 11:00 PM</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--accent-hex)" }}>Social</h3>
                <div className="flex gap-4">
                  <a href="https://www.instagram.com/midnight.tats/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity text-sm font-medium" style={{ color: "hsl(var(--text-primary))" }}>
                    Instagram
                  </a>
                  <a href="https://www.tiktok.com/@midnight.tats" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity text-sm font-medium" style={{ color: "hsl(var(--text-primary))" }}>
                    TikTok
                  </a>
                </div>
              </div>
            </div>
            <div className="card-glass overflow-hidden min-h-[300px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d35828.73289963845!2d-4.251806!3d55.860916!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x488815562056ceeb%3A0x71e683b805ef511e!2sGlasgow%2C%20UK!5e0!3m2!1sen!2suk!4v1"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 300 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Midnight Studio Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 text-center">
        <Link href="/" className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Midnight" className="w-10 h-10 rounded-full mx-auto opacity-60 hover:opacity-100 transition-opacity" />
        </Link>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Link href="/terms" className="text-xs hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-muted))" }}>
            Terms & Conditions
          </Link>
          <span style={{ color: "hsl(var(--text-muted))", opacity: 0.3 }}>&middot;</span>
          <Link href="/contact" className="text-xs hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-muted))" }}>
            Contact
          </Link>
          <span style={{ color: "hsl(var(--text-muted))", opacity: 0.3 }}>&middot;</span>
          <a href="https://www.instagram.com/midnight.tats/" target="_blank" rel="noopener noreferrer" className="text-xs hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--text-muted))" }}>
            Instagram
          </a>
        </div>
        <p className="mt-3 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
          &copy; {new Date().getFullYear()} Midnight Studio &middot; Glasgow, Scotland
        </p>
      </footer>
    </div>
  )
}
