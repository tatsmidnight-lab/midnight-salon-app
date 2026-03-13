import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CATEGORIES = [
  { name: "Tattoo", description: "Custom tattoos, fine line, cover-ups, sleeves and flash designs", sort_order: 1 },
  { name: "Piercing", description: "Professional body piercing with premium titanium jewellery", sort_order: 2 },
  { name: "Eyelash", description: "Lash extensions, lifts and tinting services", sort_order: 3 },
  { name: "Micropigmentation", description: "Semi-permanent makeup — lip blush, microblading, eyeliner", sort_order: 4 },
  { name: "Course", description: "Professional tattoo and piercing training with certification", sort_order: 5 },
]

// Exact prices from https://book.heygoldie.com/28de4f8ca604/checkout
const SERVICES = [
  // ── Tattoo ──
  { name: "Small Tattoo", description: "Small designs up to 3 inches. Perfect for first tattoos, minimalist symbols, initials or small motifs. Quick session, big impact.", base_price: 40, duration: 20, category_slug: "tattoo" },
  { name: "3 Tats Bundle", description: "Get three small tattoos in one session. Mix and match flash designs or bring your own ideas. Great value combo deal.", base_price: 100, duration: 60, category_slug: "tattoo" },
  { name: "Fine Line Tattoo", description: "Delicate fine line work with precision detail. Ideal for elegant script, botanical designs, geometric patterns or dainty artwork.", base_price: 70, duration: 30, category_slug: "tattoo" },
  { name: "Midsize Tattoo", description: "Medium-sized custom designs covering forearm, calf or upper arm. Includes consultation and bespoke design tailored to you.", base_price: 180, duration: 120, category_slug: "tattoo" },
  { name: "Cover Up Tattoo", description: "Expert cover-up work to transform or conceal existing tattoos. Up to 3 inches. Consultation required to assess feasibility and design options.", base_price: 200, duration: 120, category_slug: "tattoo" },
  { name: "Full Day Tattoo", description: "Dedicated full-day session for larger pieces. Back panels, chest pieces, thigh work or detailed custom designs. Includes breaks.", base_price: 350, duration: 210, category_slug: "tattoo" },
  { name: "Half Sleeve Tattoo", description: "Half sleeve from shoulder to elbow or elbow to wrist. Japanese, traditional, neo-traditional, blackwork or realism styles available.", base_price: 350, duration: 210, category_slug: "tattoo" },
  { name: "Full Sleeve Tattoo", description: "Complete arm sleeve from shoulder to wrist. Multiple sessions required. All styles available — Japanese, traditional, realism, blackwork.", base_price: 680, duration: 480, category_slug: "tattoo" },
  // ── Piercing ──
  { name: "Lobe Piercing", description: "Classic earlobe piercing with premium titanium jewellery included. Quick, clean and virtually painless. Aftercare kit included.", base_price: 20, duration: 10, category_slug: "piercing" },
  { name: "Nose Piercing", description: "Nostril piercing with choice of stud or ring. Includes premium implant-grade titanium jewellery and full aftercare instructions.", base_price: 30, duration: 10, category_slug: "piercing" },
  { name: "Any Ear Piercing", description: "Helix, daith, tragus, conch, rook, industrial or forward helix. Premium titanium jewellery and aftercare included.", base_price: 30, duration: 15, category_slug: "piercing" },
  { name: "Eyebrow Piercing", description: "Professional eyebrow piercing with curved barbell. Precision placement for optimal aesthetics and healing.", base_price: 30, duration: 15, category_slug: "piercing" },
  { name: "Belly Button Piercing", description: "Navel piercing with premium titanium curved barbell. Clean technique with full aftercare guidance included.", base_price: 30, duration: 10, category_slug: "piercing" },
  { name: "Tongue Piercing", description: "Professional tongue piercing with surgical steel barbell. Quick procedure with detailed aftercare and dietary guidance.", base_price: 30, duration: 15, category_slug: "piercing" },
  { name: "Septum Piercing", description: "Septum piercing with horseshoe or clicker ring. Professional technique for minimal discomfort. Easy to hide when needed.", base_price: 40, duration: 15, category_slug: "piercing" },
  { name: "Surface Piercing", description: "Surface piercing (nape, chest, wrist, anti-tragus, back). Specialist technique with surface bars for optimal healing.", base_price: 50, duration: 20, category_slug: "piercing" },
  { name: "Dermal Piercing", description: "Single dermal anchor piercing. Face, chest, hand or any flat surface. Implant-grade titanium microdermal tops available.", base_price: 55, duration: 20, category_slug: "piercing" },
  { name: "Snake Eyes Piercing", description: "Snake eyes or horizontal tongue piercing. Specialist procedure requiring experienced hands. Full consultation included.", base_price: 60, duration: 20, category_slug: "piercing" },
  { name: "Kids Lobe Piercing", description: "Both ears pierced for children. Gentle, quick procedure in a safe environment. Parent/guardian must be present with ID.", base_price: 50, duration: 5, category_slug: "piercing" },
  { name: "Back Dermals x2", description: "Pair of back dermal piercings. Symmetrical placement on lower back, dimples or nape. Includes premium titanium jewellery.", base_price: 100, duration: 15, category_slug: "piercing" },
  // ── Eyelash ──
  { name: "Classic Lash Extensions", description: "Natural-looking individual lash extensions. One extension per natural lash for a subtle, beautiful enhancement lasting 2-3 weeks.", base_price: 55, duration: 90, category_slug: "eyelash" },
  { name: "Volume Lash Extensions", description: "Full, dramatic volume lashes using handmade fans. 2-6 extensions per natural lash for a glamorous, camera-ready look.", base_price: 75, duration: 120, category_slug: "eyelash" },
  { name: "Lash Lift & Tint", description: "Semi-permanent lash lift with tint. Naturally curled, defined lashes lasting 6-8 weeks. No maintenance required.", base_price: 45, duration: 60, category_slug: "eyelash" },
  // ── Micropigmentation ──
  { name: "Lip Blush", description: "Semi-permanent lip colour for a natural, flushed look. Enhances lip shape, symmetry and definition. Lasts 2-3 years. Touch-up included.", base_price: 180, duration: 60, category_slug: "micropigmentation" },
  { name: "Microblading", description: "Hair-stroke eyebrow technique for natural, full-looking brows. Includes consultation, mapping, numbing and one touch-up session.", base_price: 160, duration: 60, category_slug: "micropigmentation" },
  { name: "Lip Contour PMU", description: "Permanent makeup lip liner for defined lip edges. Corrects asymmetry and adds shape. Natural or bold colour options available.", base_price: 120, duration: 60, category_slug: "micropigmentation" },
  { name: "Natural Lash Line", description: "Subtle permanent eyeliner along the lash line. Enhances eye definition without daily makeup. Natural-looking results.", base_price: 150, duration: 60, category_slug: "micropigmentation" },
  // ── Courses ──
  { name: "Tattoo Course", description: "3-day intensive tattoo course covering machine setup, hygiene standards, skin theory, lining and shading techniques. Certificate on completion.", base_price: 600, duration: 1440, category_slug: "course" },
  { name: "Piercing Course", description: "1-day professional piercing course with certification. Covers anatomy, sterilisation, needle technique, jewellery and aftercare protocols.", base_price: 600, duration: 480, category_slug: "course" },
]

const PRODUCTS = [
  // ── Aftercare ──
  { name: "Piercing Care Solution", description: "Antimicrobial piercing spray for daily cleaning. Sterile saline formula — spray on fresh piercings twice daily for optimal healing.", price: 5, category: "aftercare", is_active: true },
  { name: "Tattoo Aftercare Cream", description: "Premium healing balm enriched with vitamins A & E. Keeps tattoos moisturised, reduces itching and promotes vibrant colour retention.", price: 10, category: "aftercare", is_active: true },
  { name: "Tattoo Aftercare Kit", description: "Complete aftercare bundle — cleaning solution, healing cream and protective film. Everything you need for the first 2 weeks of healing.", price: 15, category: "aftercare", is_active: true },
  { name: "SPF50 Tattoo Sunscreen", description: "High-protection sunscreen for tattooed skin. Prevents fading from UV exposure. Water-resistant, non-greasy formula. 100ml tube.", price: 13, category: "aftercare", is_active: true },
  { name: "Antibacterial Soap Bar", description: "Gentle fragrance-free soap for tattoo and piercing cleaning. pH balanced, no harsh chemicals. Lasts approx 4-6 weeks of daily use.", price: 6, category: "aftercare", is_active: true },
  { name: "Titanium Piercing Jewellery", description: "Implant-grade titanium replacement jewellery. Available in studs, hoops, barbells and horseshoes. Hypoallergenic and MRI safe.", price: 12, category: "jewellery", is_active: true },
  { name: "Gold Plated Nose Ring", description: "18K gold plated surgical steel nose ring. Available in 8mm and 10mm diameters. Seamless hoop design.", price: 18, category: "jewellery", is_active: true },
  { name: "Midnight Branded Tee", description: "Official Midnight Studio t-shirt. 100% organic cotton, unisex fit. Available in black with embroidered logo.", price: 25, category: "merch", is_active: true },
  // ── Gift Cards ──
  { name: "Gift Card — £15", description: "Treat someone to piercing aftercare or products at Midnight Studio. Valid for 12 months from purchase.", price: 15, category: "gift_card", is_active: true },
  { name: "Gift Card — £50", description: "Perfect for a piercing session or aftercare bundle. Redeemable on any service or product at Midnight Studio.", price: 50, category: "gift_card", is_active: true },
  { name: "Gift Card — £100", description: "Covers a midsize tattoo, lash extensions or multiple piercings. The ideal gift for body art lovers.", price: 100, category: "gift_card", is_active: true },
  { name: "Gift Card — £200", description: "Premium gift card for custom tattoo work, micropigmentation or a full pampering session. Luxury gifting.", price: 200, category: "gift_card", is_active: true },
  { name: "Gift Card — £350", description: "The ultimate gift — covers a half sleeve, full day tattoo session or a combination of services. Go big.", price: 350, category: "gift_card", is_active: true },
  { name: "Gift Card — £750", description: "VIP gift card. Covers a full sleeve or multiple premium services. The most generous gift in body art.", price: 750, category: "gift_card", is_active: true },
]

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  if (key !== process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: string[] = []

  try {
    // 1. Seed categories
    const { data: existingCats } = await supabaseAdmin.from("service_categories").select("name")
    const existingCatNames = new Set((existingCats ?? []).map((c: { name: string }) => c.name))
    const newCats = CATEGORIES.filter((c) => !existingCatNames.has(c.name))
    if (newCats.length > 0) {
      const { error } = await supabaseAdmin.from("service_categories").insert(newCats)
      if (error) results.push(`Categories error: ${error.message}`)
      else results.push(`Inserted ${newCats.length} categories`)
    } else {
      results.push("Categories already seeded")
    }

    // 2. Get category IDs by name
    const { data: cats } = await supabaseAdmin.from("service_categories").select("id, name")
    const catMap = new Map((cats ?? []).map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id]))

    // 3. Seed services
    const { data: existingSvcs } = await supabaseAdmin.from("services").select("name")
    const existingNames = new Set((existingSvcs ?? []).map((s: { name: string }) => s.name))
    const newSvcs = SERVICES
      .filter((s) => !existingNames.has(s.name))
      .map((s) => ({
        name: s.name,
        description: s.description,
        base_price: s.base_price,
        duration: s.duration,
        category_id: catMap.get(s.category_slug) || null,
        image_url: null,
      }))
    if (newSvcs.length > 0) {
      const { error } = await supabaseAdmin.from("services").insert(newSvcs)
      if (error) results.push(`Services error: ${error.message}`)
      else results.push(`Inserted ${newSvcs.length} services`)
    } else {
      results.push("Services already seeded")
    }

    // 4. Seed products
    const { data: existingProds } = await supabaseAdmin.from("products").select("name")
    const existingProdNames = new Set((existingProds ?? []).map((p: { name: string }) => p.name))
    const newProds = PRODUCTS.filter((p) => !existingProdNames.has(p.name))
    if (newProds.length > 0) {
      const { error } = await supabaseAdmin.from("products").insert(newProds)
      if (error) results.push(`Products error: ${error.message}`)
      else results.push(`Inserted ${newProds.length} products`)
    } else {
      results.push("Products already seeded")
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ error: String(err), results }, { status: 500 })
  }
}
