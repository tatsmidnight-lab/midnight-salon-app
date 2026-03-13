"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import GeometricBg from "@/components/GeometricBg"

type Category = { id: string; name: string }
type Service = {
  id: string
  name: string
  description: string
  base_price: number
  duration: number
  image_url: string | null
  category_id: string
  artist_id: string
}

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  tattoo: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M14 4v20" />
      <path d="M8 8c0-2 2-4 6-4s6 2 6 4" />
      <path d="M7 14c3-1 5-3 7-3s4 2 7 3" />
      <circle cx="14" cy="22" r="2" fill="currentColor" />
    </svg>
  ),
  piercing: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="14" cy="14" r="4" />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" />
      <path d="M14 2v8M14 18v8M2 14h8M18 14h8" />
    </svg>
  ),
  eyelash: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 16c4-8 16-8 20 0" />
      <path d="M6 16c3-5 13-5 16 0" />
      <path d="M8 14l-2-4M11 12l-1-5M14 11v-6M17 12l1-5M20 14l2-4" />
    </svg>
  ),
  micropigmentation: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20 4L8 24" />
      <path d="M6 12c2-4 6-4 8 0" />
      <circle cx="20" cy="6" r="2" fill="currentColor" />
      <path d="M16 20c2-2 5-2 6 0" />
    </svg>
  ),
  course: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="6" width="20" height="16" rx="2" />
      <path d="M4 11h20" />
      <path d="M10 11v11" />
      <circle cx="7" cy="8.5" r="0.5" fill="currentColor" />
      <circle cx="9" cy="8.5" r="0.5" fill="currentColor" />
      <path d="M14 16h6M14 19h4" />
    </svg>
  ),
}

const CATEGORY_VARIANTS: Record<string, "piercing" | "tattoo" | "eyelash" | "default"> = {
  piercing: "piercing",
  tattoo: "tattoo",
  eyelash: "eyelash",
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: "cat-tattoo", name: "Tattoo" },
  { id: "cat-piercing", name: "Piercing" },
  { id: "cat-eyelash", name: "Eyelash" },
  { id: "cat-micropigmentation", name: "Micropigmentation" },
  { id: "cat-course", name: "Course" },
]

const FALLBACK_SERVICES: Service[] = [
  { id: "s1", name: "Small Tattoo", description: "Small designs up to 3 inches. Perfect for first tattoos, minimalist symbols, initials or small motifs.", base_price: 40, duration: 20, image_url: null, category_id: "cat-tattoo", artist_id: "" },
  { id: "s2", name: "3 Tats Bundle", description: "Get three small tattoos in one session. Mix and match flash designs or bring your own ideas.", base_price: 100, duration: 60, image_url: null, category_id: "cat-tattoo", artist_id: "" },
  { id: "s3", name: "Fine Line Tattoo", description: "Delicate fine line work with precision detail. Ideal for elegant script, botanical designs or geometric patterns.", base_price: 70, duration: 30, image_url: null, category_id: "cat-tattoo", artist_id: "" },
  { id: "s4", name: "Midsize Tattoo", description: "Medium-sized custom designs covering forearm, calf or upper arm. Includes consultation and bespoke design.", base_price: 180, duration: 120, image_url: null, category_id: "cat-tattoo", artist_id: "" },
  { id: "s5", name: "Cover Up Tattoo", description: "Expert cover-up work to transform or conceal existing tattoos. Consultation required to assess feasibility.", base_price: 200, duration: 120, image_url: null, category_id: "cat-tattoo", artist_id: "" },
  { id: "s6", name: "Full Day Tattoo", description: "Dedicated full-day session for larger pieces. Back panels, chest pieces, thigh work or detailed custom designs.", base_price: 350, duration: 210, image_url: null, category_id: "cat-tattoo", artist_id: "" },
  { id: "s7", name: "Half Sleeve Tattoo", description: "Half sleeve from shoulder to elbow or elbow to wrist. All styles available.", base_price: 350, duration: 210, image_url: null, category_id: "cat-tattoo", artist_id: "" },
  { id: "s8", name: "Full Sleeve Tattoo", description: "Complete arm sleeve from shoulder to wrist. Multiple sessions required. Japanese, traditional, realism, blackwork.", base_price: 680, duration: 480, image_url: null, category_id: "cat-tattoo", artist_id: "" },
  { id: "s9", name: "Lobe Piercing", description: "Classic earlobe piercing with premium titanium jewellery included. Quick, clean and virtually painless.", base_price: 20, duration: 10, image_url: null, category_id: "cat-piercing", artist_id: "" },
  { id: "s10", name: "Nose Piercing", description: "Nostril piercing with choice of stud or ring. Includes premium titanium jewellery and aftercare.", base_price: 30, duration: 10, image_url: null, category_id: "cat-piercing", artist_id: "" },
  { id: "s11", name: "Septum Piercing", description: "Septum piercing with horseshoe or clicker ring. Professional technique for minimal discomfort.", base_price: 40, duration: 15, image_url: null, category_id: "cat-piercing", artist_id: "" },
  { id: "s12", name: "Any Ear Piercing", description: "Helix, daith, tragus, conch, rook, industrial or forward helix. Premium titanium jewellery included.", base_price: 30, duration: 15, image_url: null, category_id: "cat-piercing", artist_id: "" },
  { id: "s13", name: "Dermal Piercing", description: "Single dermal anchor piercing. Face, chest, hand or any flat surface. Implant-grade titanium.", base_price: 55, duration: 20, image_url: null, category_id: "cat-piercing", artist_id: "" },
  { id: "s14", name: "Snake Eyes Piercing", description: "Snake eyes or horizontal tongue piercing. Specialist procedure. Full consultation included.", base_price: 60, duration: 20, image_url: null, category_id: "cat-piercing", artist_id: "" },
  { id: "s15", name: "Classic Lash Extensions", description: "Natural-looking individual lash extensions. One extension per natural lash for subtle enhancement.", base_price: 55, duration: 90, image_url: null, category_id: "cat-eyelash", artist_id: "" },
  { id: "s16", name: "Volume Lash Extensions", description: "Full, dramatic volume lashes using handmade fans. Perfect for a glamorous, camera-ready look.", base_price: 75, duration: 120, image_url: null, category_id: "cat-eyelash", artist_id: "" },
  { id: "s17", name: "Lash Lift & Tint", description: "Semi-permanent lash lift with tint for naturally curled, defined lashes lasting 6-8 weeks.", base_price: 45, duration: 60, image_url: null, category_id: "cat-eyelash", artist_id: "" },
  { id: "s18", name: "Lip Blush", description: "Semi-permanent lip colour. Enhances lip shape, symmetry and definition. Lasts 2-3 years. Touch-up included.", base_price: 180, duration: 60, image_url: null, category_id: "cat-micropigmentation", artist_id: "" },
  { id: "s19", name: "Microblading", description: "Hair-stroke eyebrow technique for natural, full-looking brows. Includes consultation and touch-up session.", base_price: 160, duration: 60, image_url: null, category_id: "cat-micropigmentation", artist_id: "" },
  { id: "s20", name: "Lip Contour PMU", description: "Permanent makeup lip liner for defined lip edges. Corrects asymmetry and adds shape.", base_price: 120, duration: 60, image_url: null, category_id: "cat-micropigmentation", artist_id: "" },
  { id: "s21", name: "Natural Lash Line", description: "Subtle permanent eyeliner along the lash line. Enhances eye definition without daily makeup.", base_price: 150, duration: 60, image_url: null, category_id: "cat-micropigmentation", artist_id: "" },
  { id: "s22", name: "Tattoo Course", description: "3-day intensive course covering machine setup, hygiene, skin theory, lining and shading. Certificate included.", base_price: 600, duration: 1440, image_url: null, category_id: "cat-course", artist_id: "" },
  { id: "s23", name: "Piercing Course", description: "1-day professional piercing course with certification. Covers anatomy, sterilisation, technique and aftercare.", base_price: 600, duration: 480, image_url: null, category_id: "cat-course", artist_id: "" },
]

function formatDuration(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function getCategoryIcon(name: string) {
  const key = name.toLowerCase()
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon
  }
  return CATEGORY_ICONS.tattoo
}

export default function ServicesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [bgVariant, setBgVariant] = useState<"piercing" | "tattoo" | "eyelash" | "default">("default")
  const [expandedService, setExpandedService] = useState<string | null>(null)
  const servicesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const fetchData = async () => {
      let cats: Category[] = []
      let svcs: Service[] = []
      try {
        const [catRes, svcRes] = await Promise.all([
          fetch("/api/services/get-categories", { signal: controller.signal }),
          fetch("/api/services", { signal: controller.signal }),
        ])
        if (catRes.ok) {
          const data = await catRes.json()
          cats = Array.isArray(data) ? data : []
        }
        if (svcRes.ok) {
          const data = await svcRes.json()
          svcs = Array.isArray(data) ? data : []
        }
      } catch {}
      clearTimeout(timeout)
      const expectedNames = ["Tattoo", "Piercing", "Eyelash"]
      const catNames = cats.map((c) => c.name)
      const hasMidnightCats = expectedNames.some((n) => catNames.includes(n))
      setCategories(hasMidnightCats ? cats : FALLBACK_CATEGORIES)
      setServices(svcs.length > 2 ? svcs : FALLBACK_SERVICES)
      setLoading(false)
    }
    fetchData()
    return () => { clearTimeout(timeout); controller.abort() }
  }, [])

  useEffect(() => {
    if (!activeCategory) { setBgVariant("default"); return }
    const cat = categories.find((c) => c.id === activeCategory)
    if (cat) {
      const slug = cat.name.toLowerCase()
      const variant = Object.keys(CATEGORY_VARIANTS).find((k) => slug.includes(k))
      setBgVariant(variant ? CATEGORY_VARIANTS[variant] : "default")
    } else {
      setBgVariant("default")
    }
  }, [activeCategory, categories])

  const filteredServices = activeCategory
    ? services.filter((s) => s.category_id === activeCategory)
    : []

  const getServiceCount = (catId: string) =>
    services.filter((s) => s.category_id === catId).length

  const getPriceRange = (catId: string) => {
    const catServices = services.filter((s) => s.category_id === catId)
    if (catServices.length === 0) return ""
    const min = Math.min(...catServices.map((s) => s.base_price))
    const max = Math.max(...catServices.map((s) => s.base_price))
    return min === max ? `\u00A3${min}` : `\u00A3${min} \u2013 \u00A3${max}`
  }

  const handleCategoryClick = (catId: string) => {
    if (activeCategory === catId) {
      setActiveCategory(null)
      setExpandedService(null)
    } else {
      setActiveCategory(catId)
      setExpandedService(null)
      setTimeout(() => {
        servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }

  const handleBook = (service: Service) => {
    router.push(`/services/book?serviceId=${service.id}`)
  }

  return (
    <div className="relative min-h-screen pt-20 pb-16">
      <GeometricBg variant={bgVariant} />

      <div className="relative max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10 animate-page-enter">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
            Our Services
          </h1>
          <p className="text-lg" style={{ color: "hsl(var(--text-secondary))" }}>
            Tap a category to explore
          </p>
        </div>

        {/* Category Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card-glass p-5 animate-pulse">
                <div className="w-10 h-10 rounded-full mb-3" style={{ background: "var(--surface-2-hex)" }} />
                <div className="h-4 w-2/3 rounded mb-2" style={{ background: "var(--surface-2-hex)" }} />
                <div className="h-3 w-1/2 rounded" style={{ background: "var(--surface-2-hex)" }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 stagger-children">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id
              const count = getServiceCount(cat.id)
              const priceRange = getPriceRange(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`relative p-5 rounded-2xl text-left transition-all duration-400 group overflow-hidden ${
                    isActive
                      ? "ring-2 scale-[1.02] shadow-xl"
                      : "hover:scale-[1.02] hover:shadow-lg"
                  }`}
                  style={{
                    background: "var(--glass-bg)",
                    border: `1px solid ${isActive ? "var(--accent-hex)" : "var(--glass-border)"}`,
                    ["--tw-ring-color" as string]: "var(--accent-hex)",
                  }}
                >
                  {/* Glow effect when active */}
                  {isActive && (
                    <div
                      className="absolute inset-0 opacity-10 rounded-2xl"
                      style={{ background: `linear-gradient(135deg, var(--gradient-start), var(--gradient-end))` }}
                    />
                  )}

                  <div className="relative">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                        isActive ? "scale-110" : "group-hover:scale-105"
                      }`}
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))"
                          : "var(--surface-2-hex)",
                        color: isActive ? "white" : "hsl(var(--text-secondary))",
                      }}
                    >
                      {getCategoryIcon(cat.name)}
                    </div>

                    {/* Name */}
                    <h3
                      className="font-bold text-sm sm:text-base mb-1 transition-colors duration-300"
                      style={{ color: isActive ? "var(--accent-hex)" : "hsl(var(--text-primary))" }}
                    >
                      {cat.name}
                    </h3>

                    {/* Meta */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                        {count} {count === 1 ? "service" : "services"}
                      </span>
                    </div>
                    {priceRange && (
                      <span
                        className="text-xs font-semibold mt-1 block"
                        style={{ color: isActive ? "var(--accent-hex)" : "hsl(var(--text-secondary))" }}
                      >
                        {priceRange}
                      </span>
                    )}
                  </div>

                  {/* Active indicator */}
                  <div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300 ${
                      isActive ? "w-8 opacity-100" : "w-0 opacity-0"
                    }`}
                    style={{ background: "var(--accent-hex)" }}
                  />
                </button>
              )
            })}
          </div>
        )}

        {/* Services List — slides in when category selected */}
        <div ref={servicesRef} className="scroll-mt-24">
          {activeCategory && filteredServices.length > 0 && (
            <div className="animate-fade-up">
              {/* Section header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
                  {categories.find((c) => c.id === activeCategory)?.name}
                </h2>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-muted))" }}>
                  {filteredServices.length} {filteredServices.length === 1 ? "service" : "services"}
                </span>
              </div>

              {/* Service rows */}
              <div className="space-y-2 stagger-children">
                {filteredServices.map((svc) => {
                  const isExpanded = expandedService === svc.id
                  return (
                    <div
                      key={svc.id}
                      className={`card-glass overflow-hidden transition-all duration-300 ${
                        isExpanded ? "ring-1" : "hover:translate-x-1"
                      }`}
                      style={{
                        borderColor: isExpanded ? "var(--accent-hex)" : undefined,
                        ["--tw-ring-color" as string]: "var(--accent-hex)",
                      }}
                    >
                      {/* Main row — always visible */}
                      <button
                        onClick={() => setExpandedService(isExpanded ? null : svc.id)}
                        className="w-full flex items-center gap-4 p-4 text-left group"
                      >
                        {/* Thumbnail or icon */}
                        <div
                          className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105"
                          style={{ background: "var(--surface-2-hex)" }}
                        >
                          {svc.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={svc.image_url} alt={svc.name} className="w-full h-full object-cover" />
                          ) : (
                            <span style={{ color: "var(--accent-hex)" }}>
                              {getCategoryIcon(categories.find((c) => c.id === svc.category_id)?.name || "")}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm sm:text-base truncate" style={{ color: "hsl(var(--text-primary))" }}>
                            {svc.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--text-muted))" }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <circle cx="6" cy="6" r="5" />
                                <path d="M6 3v3l2 1" />
                              </svg>
                              {formatDuration(svc.duration)}
                            </span>
                          </div>
                        </div>

                        {/* Price + chevron */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-lg font-bold" style={{ color: "var(--accent-hex)" }}>
                            &pound;{svc.base_price}
                          </span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="hsl(var(--text-muted))"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <path d="M4 6l4 4 4-4" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded details */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="px-4 pb-4 pt-0">
                          <div className="border-t pt-3 mb-3" style={{ borderColor: "var(--glass-border)" }}>
                            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--text-secondary))" }}>
                              {svc.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleBook(svc)}
                            className="btn-primary w-full !py-3 text-sm flex items-center justify-center gap-2"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <rect x="2" y="3" width="12" height="11" rx="1.5" />
                              <path d="M5 1v4M11 1v4M2 7h12" />
                            </svg>
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Prompt when no category selected */}
          {!loading && !activeCategory && (
            <div className="text-center py-16 animate-fade-in">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center animate-float"
                style={{ background: "var(--surface-2-hex)" }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8 12l8-8 8 8M8 20l8 8 8-8" />
                </svg>
              </div>
              <p className="text-lg font-medium" style={{ color: "hsl(var(--text-secondary))" }}>
                Select a category above to view services
              </p>
              <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                {services.length} services across {categories.length} categories
              </p>
            </div>
          )}

          {/* Empty category */}
          {!loading && activeCategory && filteredServices.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <p style={{ color: "hsl(var(--text-muted))" }}>No services in this category yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
