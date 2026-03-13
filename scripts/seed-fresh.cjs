/**
 * Full seed data for Midnight Studio — fresh database
 * Run: node scripts/seed-fresh.cjs
 */

const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const { randomUUID } = require("crypto")

// Load .env.local
const envFile = fs.readFileSync(".env.local", "utf-8")
const env = {}
envFile.split("\n").forEach(line => {
  const t = line.trim()
  if (!t || t.startsWith("#")) return
  const eq = t.indexOf("=")
  if (eq === -1) return
  env[t.slice(0, eq)] = t.slice(eq + 1)
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// ═══════════════════════════════════════════════════════════
// IDs — pre-generated so we can cross-reference
// ═══════════════════════════════════════════════════════════

const IDS = {
  // Users
  admin_kiash: randomUUID(),
  admin_sophie: randomUUID(),
  artist_marcus: randomUUID(),
  artist_jade: randomUUID(),
  artist_nia: randomUUID(),
  artist_priya: randomUUID(),
  artist_tyler: randomUUID(),
  customer_emma: randomUUID(),
  customer_james: randomUUID(),
  customer_zara: randomUUID(),
  customer_liam: randomUUID(),
  customer_sara: randomUUID(),

  // Artists (table IDs — separate from user IDs)
  prof_marcus: randomUUID(),
  prof_jade: randomUUID(),
  prof_nia: randomUUID(),
  prof_priya: randomUUID(),
  prof_tyler: randomUUID(),

  // Categories
  cat_tattoo: randomUUID(),
  cat_piercing: randomUUID(),
  cat_lash: randomUUID(),
  cat_micropig: randomUUID(),
  cat_course: randomUUID(),
}

async function seed() {
  console.log("=== Midnight Studio — Full Seed ===\n")

  // ─── USERS ──────────────────────────────────────────────
  console.log("--- Users ---")
  const users = [
    { id: IDS.admin_kiash, display_name: "Kiash", phone: "+447446952026", email: "kiash@midnight.studio", role: "admin" },
    { id: IDS.admin_sophie, display_name: "Sophie Admin", phone: "+447700000002", email: "sophie@midnight.studio", role: "admin" },
    { id: IDS.artist_marcus, display_name: "Marcus Ink", phone: "+447700100001", email: "marcus@midnight.studio", role: "artist" },
    { id: IDS.artist_jade, display_name: "Jade Pierce", phone: "+447700100002", email: "jade@midnight.studio", role: "artist" },
    { id: IDS.artist_nia, display_name: "Nia Lashes", phone: "+447700100003", email: "nia@midnight.studio", role: "artist" },
    { id: IDS.artist_priya, display_name: "Priya Brow", phone: "+447700100004", email: "priya@midnight.studio", role: "artist" },
    { id: IDS.artist_tyler, display_name: "Tyler Flash", phone: "+447700100005", email: "tyler@midnight.studio", role: "artist" },
    { id: IDS.customer_emma, display_name: "Emma Watson", phone: "+447700200001", email: "emma@test.com", role: "customer" },
    { id: IDS.customer_james, display_name: "James Chen", phone: "+447700200002", email: "james@test.com", role: "customer" },
    { id: IDS.customer_zara, display_name: "Zara Ali", phone: "+447700200003", email: "zara@test.com", role: "customer" },
    { id: IDS.customer_liam, display_name: "Liam O'Brien", phone: "+447700200004", email: "liam@test.com", role: "customer" },
    { id: IDS.customer_sara, display_name: "Sara Patel", phone: "+447700200005", email: "sara@test.com", role: "customer" },
  ]

  const { error: usersErr } = await supabase.from("users").insert(users)
  if (usersErr) console.log("  Users error:", usersErr.message)
  else console.log(`  ${users.length} users created`)

  // ─── ARTISTS ────────────────────────────────────────────
  console.log("\n--- Artists ---")
  const artists = [
    {
      id: IDS.prof_marcus, user_id: IDS.artist_marcus,
      bio: "Specialist in Japanese irezumi and blackwork tattoos with 8 years experience. Known for bold lines, intricate detail, and large-scale back pieces. Trained in Tokyo under Master Horiyoshi III's apprentice.",
      specialties: ["Japanese", "Blackwork", "Neo-Traditional"],
      instagram_url: "@marcus_ink_midnight",
      is_active: true,
    },
    {
      id: IDS.prof_jade, user_id: IDS.artist_jade,
      bio: "Professional body piercer certified by the APP (Association of Professional Piercers). Focused on precision placement, curated ear projects, and premium ASTM-F136 titanium jewellery. 6+ years experience.",
      specialties: ["Ear Curation", "Surface Piercings", "Dermals"],
      instagram_url: "@jade_pierce_midnight",
      is_active: true,
    },
    {
      id: IDS.prof_nia, user_id: IDS.artist_nia,
      bio: "Volume and mega-volume lash extension specialist. Creating natural, wispy, and dramatic looks since 2019. Trained in Russian volume technique. Lash lift and tint expert.",
      specialties: ["Volume Lashes", "Mega Volume", "Lash Lift"],
      instagram_url: "@nia_lashes_midnight",
      is_active: true,
    },
    {
      id: IDS.prof_priya, user_id: IDS.artist_priya,
      bio: "Micropigmentation expert — lip blush, powder brows, microblading and permanent eyeliner. Trained in Seoul at the Korean Permanent Makeup Academy. 5+ years experience with 2000+ procedures.",
      specialties: ["Lip Blush", "Microblading", "Powder Brows"],
      instagram_url: "@priya_brow_midnight",
      is_active: true,
    },
    {
      id: IDS.prof_tyler, user_id: IDS.artist_tyler,
      bio: "Fine line and minimalist tattoo specialist. Focus on clean, delicate botanical work, script, and small geometric pieces. Also teaches the 3-day beginner tattoo course.",
      specialties: ["Fine Line", "Minimalist", "Botanical"],
      instagram_url: "@tyler_flash_midnight",
      is_active: true,
    },
  ]

  const { error: artistsErr } = await supabase.from("artists").insert(artists)
  if (artistsErr) console.log("  Artists error:", artistsErr.message)
  else console.log(`  ${artists.length} artist profiles created`)

  // ─── SERVICE CATEGORIES ─────────────────────────────────
  console.log("\n--- Service Categories ---")
  const categories = [
    { id: IDS.cat_tattoo, name: "Tattoo", sort_order: 1 },
    { id: IDS.cat_piercing, name: "Piercing", sort_order: 2 },
    { id: IDS.cat_lash, name: "Lash & Brow", sort_order: 3 },
    { id: IDS.cat_micropig, name: "Micropigmentation", sort_order: 4 },
    { id: IDS.cat_course, name: "Courses", sort_order: 5 },
  ]

  const { error: catErr } = await supabase.from("service_categories").insert(categories)
  if (catErr) console.log("  Categories error:", catErr.message)
  else console.log(`  ${categories.length} categories created`)

  // ─── SERVICES ───────────────────────────────────────────
  console.log("\n--- Services ---")
  const services = [
    // Tattoo — Marcus & Tyler
    { name: "Small Tattoo (up to 5cm)", description: "Perfect for first timers. Clean line work, small symbols, initials, or tiny designs. Includes consultation and aftercare advice.", category_id: IDS.cat_tattoo, artist_id: IDS.prof_marcus, base_price: 80, duration: 60, is_active: true },
    { name: "Medium Tattoo (5-15cm)", description: "Forearm, calf or shoulder piece. Enough space for detailed work — floral, animals, portraits, or custom lettering.", category_id: IDS.cat_tattoo, artist_id: IDS.prof_marcus, base_price: 180, duration: 120, is_active: true },
    { name: "Large Tattoo (half sleeve / back)", description: "Major statement piece. Japanese sleeves, full back panels, or large-scale blackwork. Priced per session, typically 3-6 sessions.", category_id: IDS.cat_tattoo, artist_id: IDS.prof_marcus, base_price: 350, duration: 240, is_active: true },
    { name: "Fine Line Tattoo", description: "Delicate single-needle work. Botanicals, script, constellations, minimalist portraits. Tyler's signature style.", category_id: IDS.cat_tattoo, artist_id: IDS.prof_tyler, base_price: 120, duration: 90, is_active: true },
    { name: "Cover-Up Tattoo", description: "Transform an old or unwanted tattoo into something new. Free consultation to assess feasibility and design options.", category_id: IDS.cat_tattoo, artist_id: IDS.prof_marcus, base_price: 200, duration: 150, is_active: true },
    { name: "Tattoo Touch-Up", description: "Refresh faded lines or colour on an existing Midnight Studio tattoo. Free within 3 months of original session.", category_id: IDS.cat_tattoo, artist_id: IDS.prof_marcus, base_price: 50, duration: 45, is_active: true },

    // Piercing — Jade
    { name: "Lobe Piercing (single)", description: "Classic earlobe piercing with implant-grade titanium stud. Includes piercing, jewellery, and aftercare solution.", category_id: IDS.cat_piercing, artist_id: IDS.prof_jade, base_price: 25, duration: 15, is_active: true },
    { name: "Lobe Piercing (pair)", description: "Both earlobes done in one session. Includes two titanium studs and aftercare.", category_id: IDS.cat_piercing, artist_id: IDS.prof_jade, base_price: 40, duration: 20, is_active: true },
    { name: "Helix / Cartilage Piercing", description: "Upper ear cartilage piercing. Flat back labret stud in ASTM-F136 titanium. Heals in 6-9 months.", category_id: IDS.cat_piercing, artist_id: IDS.prof_jade, base_price: 35, duration: 20, is_active: true },
    { name: "Tragus Piercing", description: "Inner ear tragus piercing with precision placement. Titanium flat back labret included.", category_id: IDS.cat_piercing, artist_id: IDS.prof_jade, base_price: 35, duration: 20, is_active: true },
    { name: "Nose Piercing (nostril)", description: "Classic nostril piercing with L-bend or nose screw in surgical titanium. Quick and clean.", category_id: IDS.cat_piercing, artist_id: IDS.prof_jade, base_price: 30, duration: 15, is_active: true },
    { name: "Septum Piercing", description: "Septum piercing with circular barbell or clicker ring. Sweet spot technique for minimal pain.", category_id: IDS.cat_piercing, artist_id: IDS.prof_jade, base_price: 40, duration: 20, is_active: true },
    { name: "Curated Ear Project (3+ piercings)", description: "Design a complete ear aesthetic — choose 3+ piercings positioned for your unique anatomy. Consultation + execution in one session.", category_id: IDS.cat_piercing, artist_id: IDS.prof_jade, base_price: 90, duration: 45, is_active: true },
    { name: "Navel Piercing", description: "Belly button piercing with curved barbell. Titanium jewellery included. 9-12 month healing time.", category_id: IDS.cat_piercing, artist_id: IDS.prof_jade, base_price: 40, duration: 20, is_active: true },

    // Lash & Brow — Nia
    { name: "Classic Lash Extensions (full set)", description: "One extension per natural lash. Natural, everyday look with added length and definition. 60-80 lashes per eye.", category_id: IDS.cat_lash, artist_id: IDS.prof_nia, base_price: 65, duration: 90, is_active: true },
    { name: "Volume Lash Extensions (full set)", description: "2-6 ultra-fine extensions fanned per natural lash. Fuller, fluffier look. Nia's most popular service.", category_id: IDS.cat_lash, artist_id: IDS.prof_nia, base_price: 85, duration: 120, is_active: true },
    { name: "Mega Volume Lashes", description: "Maximum drama — 6-16 ultra-fine extensions per natural lash. Red carpet, photoshoot, or glam everyday look.", category_id: IDS.cat_lash, artist_id: IDS.prof_nia, base_price: 110, duration: 150, is_active: true },
    { name: "Lash Infill (2-3 weeks)", description: "Maintenance appointment to replace grown-out extensions. Must be within 3 weeks of previous appointment.", category_id: IDS.cat_lash, artist_id: IDS.prof_nia, base_price: 45, duration: 60, is_active: true },
    { name: "Lash Lift & Tint", description: "Semi-permanent lash curl + dark tint. No extensions needed — enhances your natural lashes. Lasts 6-8 weeks.", category_id: IDS.cat_lash, artist_id: IDS.prof_nia, base_price: 45, duration: 45, is_active: true },
    { name: "Brow Lamination", description: "Brow perm that brushes hairs upward for a full, fluffy look. Includes shape and tint. Lasts 6-8 weeks.", category_id: IDS.cat_lash, artist_id: IDS.prof_nia, base_price: 40, duration: 45, is_active: true },

    // Micropigmentation — Priya
    { name: "Microblading", description: "Semi-permanent hair-stroke brows using a manual blade. Natural, realistic results. Includes consultation + touch-up at 6 weeks.", category_id: IDS.cat_micropig, artist_id: IDS.prof_priya, base_price: 280, duration: 150, is_active: true },
    { name: "Powder Brows (ombré)", description: "Soft, powdered fill effect using machine. More defined than microblading. Ideal for oily skin types. Includes touch-up.", category_id: IDS.cat_micropig, artist_id: IDS.prof_priya, base_price: 300, duration: 150, is_active: true },
    { name: "Combo Brows (blade + shade)", description: "Best of both worlds — hair strokes at the front, powder fill through the body and tail. Most natural-looking result.", category_id: IDS.cat_micropig, artist_id: IDS.prof_priya, base_price: 320, duration: 180, is_active: true },
    { name: "Lip Blush", description: "Semi-permanent lip colour. Corrects asymmetry, adds definition, and gives a natural 'just bitten' tint. Includes touch-up.", category_id: IDS.cat_micropig, artist_id: IDS.prof_priya, base_price: 300, duration: 150, is_active: true },
    { name: "Permanent Eyeliner", description: "Subtle lash line enhancement or classic winged liner. Machine-applied for precision. Includes touch-up at 6 weeks.", category_id: IDS.cat_micropig, artist_id: IDS.prof_priya, base_price: 250, duration: 120, is_active: true },

    // Courses — Tyler
    { name: "3-Day Tattoo Fundamentals Course", description: "Learn machine setup, needle types, skin theory, hygiene, and practice on synthetic skin. Certificate of completion. Max 4 students.", category_id: IDS.cat_course, artist_id: IDS.prof_tyler, base_price: 1200, duration: 480, is_active: true },
  ]

  const { error: svcErr } = await supabase.from("services").insert(services)
  if (svcErr) console.log("  Services error:", svcErr.message)
  else console.log(`  ${services.length} services created`)

  // ─── PRODUCTS ───────────────────────────────────────────
  console.log("\n--- Products ---")
  const products = [
    // Aftercare
    { name: "Tattoo Aftercare Kit", description: "Complete healing bundle — antimicrobial wash, moisturising balm, and protective film. Everything for the first 2 weeks of tattoo healing.", price: 15, category: "aftercare", sku: "AC-TAT-KIT", stock_qty: 50, is_active: true },
    { name: "Tattoo Aftercare Cream", description: "Premium healing balm with vitamins A & E, shea butter, and panthenol. Keeps tattoos moisturised and promotes vibrant colour retention.", price: 10, category: "aftercare", sku: "AC-TAT-CRM", stock_qty: 80, is_active: true },
    { name: "SPF50 Tattoo Sunscreen", description: "High-protection sunscreen specifically for tattooed skin. Prevents UV fading. Water-resistant, non-greasy formula. 100ml.", price: 13, category: "aftercare", sku: "AC-TAT-SPF", stock_qty: 60, is_active: true },
    { name: "Piercing Care Solution", description: "Sterile saline spray for daily piercing cleaning. Isotonic 0.9% NaCl — the only aftercare your piercing needs. 75ml.", price: 5, category: "aftercare", sku: "AC-PRC-SAL", stock_qty: 100, is_active: true },
    { name: "Antibacterial Soap Bar", description: "Gentle fragrance-free soap for tattoo and piercing cleaning. pH balanced, no harsh chemicals, no dyes. 100g bar.", price: 6, category: "aftercare", sku: "AC-GEN-SOP", stock_qty: 70, is_active: true },
    { name: "Lash Cleanser Foam", description: "Oil-free foaming cleanser for lash extension maintenance. Removes makeup residue without dissolving adhesive. 50ml.", price: 12, category: "aftercare", sku: "AC-LSH-CLN", stock_qty: 40, is_active: true },

    // Jewellery
    { name: "Titanium Flat Back Labret (16g)", description: "ASTM-F136 implant-grade titanium flat back labret. Available in 6mm, 8mm lengths. Ideal for helix, tragus, conch.", price: 12, category: "jewellery", sku: "JW-TI-FBL", stock_qty: 60, is_active: true },
    { name: "Gold Plated Nose Ring (20g)", description: "18K gold plated surgical steel seamless nose ring. Available in 8mm and 10mm diameter. Hypoallergenic.", price: 18, category: "jewellery", sku: "JW-GP-NSR", stock_qty: 35, is_active: true },
    { name: "Titanium Clicker Ring", description: "Hinged segment ring in polished titanium. Perfect for septum, daith, or helix. 16g, 8mm inner diameter.", price: 22, category: "jewellery", sku: "JW-TI-CLK", stock_qty: 25, is_active: true },
    { name: "CZ Threadless End (single)", description: "Sparkling cubic zirconia gem in titanium threadless push-pin setting. Fits any 16g/18g threadless post. 3mm stone.", price: 15, category: "jewellery", sku: "JW-CZ-THL", stock_qty: 45, is_active: true },

    // Merch
    { name: "Midnight Branded Tee", description: "Official Midnight Studio t-shirt. 100% organic cotton, 180gsm, unisex relaxed fit. Black with embroidered logo on chest.", price: 25, category: "merch", sku: "MR-TEE-BLK", stock_qty: 30, is_active: true },
    { name: "Midnight Tote Bag", description: "Heavy-duty canvas tote with screen-printed Midnight logo. Perfect for carrying aftercare products home.", price: 12, category: "merch", sku: "MR-TOT-BLK", stock_qty: 25, is_active: true },
    { name: "Midnight Beanie", description: "Ribbed knit beanie in black with embroidered Midnight wordmark. One size fits all. Acrylic blend.", price: 18, category: "merch", sku: "MR-BNE-BLK", stock_qty: 20, is_active: true },

    // Gift Cards
    { name: "Gift Card — £25", description: "Midnight Studio gift card. Redeemable for any service or product. Valid for 12 months from purchase.", price: 25, category: "gift_card", sku: "GC-025", stock_qty: null, is_active: true },
    { name: "Gift Card — £50", description: "Midnight Studio gift card. Perfect for a piercing session or lash set. Valid for 12 months.", price: 50, category: "gift_card", sku: "GC-050", stock_qty: null, is_active: true },
    { name: "Gift Card — £100", description: "Midnight Studio gift card. Ideal for tattoo sessions or micropigmentation. Valid for 12 months.", price: 100, category: "gift_card", sku: "GC-100", stock_qty: null, is_active: true },
  ]

  const { error: prodErr } = await supabase.from("products").insert(products)
  if (prodErr) console.log("  Products error:", prodErr.message)
  else console.log(`  ${products.length} products created`)

  // ─── COUPONS ────────────────────────────────────────────
  console.log("\n--- Coupons ---")
  const coupons = [
    { code: "WELCOME10", description: "Welcome discount — 10% off your first order", discount_type: "percentage", discount_value: 10, min_order_total: 0, max_uses: null, expires_at: "2027-01-01", is_active: true },
    { code: "MIDNIGHT20", description: "20% off any order over £30", discount_type: "percentage", discount_value: 20, min_order_total: 30, max_uses: 100, expires_at: "2026-12-31", is_active: true },
    { code: "FIVER", description: "£5 off any order over £10", discount_type: "fixed", discount_value: 5, min_order_total: 10, max_uses: 200, expires_at: "2026-12-31", is_active: true },
    { code: "FLASH30", description: "Flash sale — 30% off everything this weekend", discount_type: "percentage", discount_value: 30, min_order_total: 0, max_uses: 50, expires_at: "2026-04-01", is_active: true },
    { code: "FREESHIP", description: "Free shipping (£3 off)", discount_type: "fixed", discount_value: 3, min_order_total: 15, max_uses: null, expires_at: "2027-01-01", is_active: true },
  ]

  const { error: coupErr } = await supabase.from("coupons").insert(coupons)
  if (coupErr) console.log("  Coupons error:", coupErr.message)
  else console.log(`  ${coupons.length} coupons created`)

  // ─── BOOKINGS ───────────────────────────────────────────
  console.log("\n--- Bookings ---")
  const now = new Date()
  const day = (offset) => new Date(now.getTime() + offset * 86400000).toISOString().split("T")[0]

  const bookings = [
    { customer_id: IDS.customer_emma, artist_id: IDS.prof_marcus, service_id: null, booking_date: day(1), booking_time: "10:00", duration_minutes: 60, total_price: 80, status: "confirmed", notes: "Small rose on inner wrist" },
    { customer_id: IDS.customer_james, artist_id: IDS.prof_jade, service_id: null, booking_date: day(1), booking_time: "14:00", duration_minutes: 20, total_price: 30, status: "pending", notes: "First piercing, a bit nervous" },
    { customer_id: IDS.customer_zara, artist_id: IDS.prof_nia, service_id: null, booking_date: day(2), booking_time: "11:00", duration_minutes: 120, total_price: 85, status: "pending", notes: "Volume set — natural wispy look" },
    { customer_id: IDS.customer_liam, artist_id: IDS.prof_tyler, service_id: null, booking_date: day(3), booking_time: "15:00", duration_minutes: 90, total_price: 120, status: "confirmed", notes: "Fine line botanical — lavender sprig on forearm" },
    { customer_id: IDS.customer_sara, artist_id: IDS.prof_priya, service_id: null, booking_date: day(5), booking_time: "10:00", duration_minutes: 150, total_price: 280, status: "pending", notes: "Microblading consultation + procedure" },
    { customer_id: IDS.customer_emma, artist_id: IDS.prof_jade, service_id: null, booking_date: day(-1), booking_time: "16:00", duration_minutes: 45, total_price: 90, status: "completed", notes: "Curated ear — 3 helix piercings" },
    { customer_id: IDS.customer_james, artist_id: IDS.prof_marcus, service_id: null, booking_date: day(-3), booking_time: "11:00", duration_minutes: 120, total_price: 180, status: "completed", notes: "Medium koi fish forearm piece" },
    { customer_id: IDS.customer_zara, artist_id: IDS.prof_nia, service_id: null, booking_date: day(-7), booking_time: "13:00", duration_minutes: 45, total_price: 45, status: "completed", notes: "Lash lift and tint" },
  ]

  // Look up service IDs to link
  const { data: allSvcs } = await supabase.from("services").select("id, name")
  const svcMap = new Map((allSvcs || []).map(s => [s.name, s.id]))

  bookings[0].service_id = svcMap.get("Small Tattoo (up to 5cm)") || null
  bookings[1].service_id = svcMap.get("Nose Piercing (nostril)") || null
  bookings[2].service_id = svcMap.get("Volume Lash Extensions (full set)") || null
  bookings[3].service_id = svcMap.get("Fine Line Tattoo") || null
  bookings[4].service_id = svcMap.get("Microblading") || null
  bookings[5].service_id = svcMap.get("Curated Ear Project (3+ piercings)") || null
  bookings[6].service_id = svcMap.get("Medium Tattoo (5-15cm)") || null
  bookings[7].service_id = svcMap.get("Lash Lift & Tint") || null

  const { error: bookErr } = await supabase.from("bookings").insert(bookings)
  if (bookErr) console.log("  Bookings error:", bookErr.message)
  else console.log(`  ${bookings.length} bookings created`)

  // ─── ORDERS ─────────────────────────────────────────────
  console.log("\n--- Orders ---")
  const { data: allProds } = await supabase.from("products").select("id, name, price")
  const prodMap = new Map((allProds || []).map(p => [p.name, p]))

  const orderData = [
    {
      customer_id: IDS.customer_emma,
      status: "pending",
      items: [
        { name: "Tattoo Aftercare Kit", qty: 1 },
        { name: "SPF50 Tattoo Sunscreen", qty: 2 },
      ],
      notes: "Collecting after my tattoo appointment tomorrow",
    },
    {
      customer_id: IDS.customer_james,
      status: "processing",
      items: [{ name: "Gift Card — £100", qty: 1 }],
      notes: "Birthday gift for my girlfriend",
    },
    {
      customer_id: IDS.customer_zara,
      status: "pending",
      items: [
        { name: "Lash Cleanser Foam", qty: 2 },
        { name: "Midnight Tote Bag", qty: 1 },
      ],
      notes: null,
    },
    {
      customer_id: IDS.customer_liam,
      status: "delivered",
      items: [
        { name: "Tattoo Aftercare Cream", qty: 3 },
        { name: "Antibacterial Soap Bar", qty: 2 },
        { name: "Midnight Branded Tee", qty: 1 },
      ],
      notes: "Collected in store",
      coupon_code: "WELCOME10",
    },
    {
      customer_id: IDS.customer_sara,
      status: "pending",
      items: [
        { name: "Piercing Care Solution", qty: 3 },
        { name: "Titanium Flat Back Labret (16g)", qty: 2 },
        { name: "CZ Threadless End (single)", qty: 2 },
      ],
      notes: "For aftercare + upgrade jewellery",
    },
  ]

  for (const ord of orderData) {
    const itemsJson = []
    let totalPrice = 0
    for (const item of ord.items) {
      const prod = prodMap.get(item.name)
      if (!prod) { console.log(`  Product not found: ${item.name}`); continue }
      const lineTotal = prod.price * item.qty
      totalPrice += lineTotal
      itemsJson.push({
        name: prod.name, product_id: prod.id,
        quantity: item.qty, unit_price: prod.price, line_total: lineTotal,
      })
    }

    // Apply discount if coupon
    let discountAmount = 0
    if (ord.coupon_code === "WELCOME10") {
      discountAmount = Math.round(totalPrice * 0.1 * 100) / 100
    }
    const finalPrice = Math.round((totalPrice - discountAmount) * 100) / 100

    const { data: created, error: ordErr } = await supabase.from("orders").insert({
      customer_id: ord.customer_id,
      order_date: new Date(now.getTime() - Math.random() * 7 * 86400000).toISOString(),
      total_price: finalPrice,
      status: ord.status,
      items_json: itemsJson,
      notes: ord.notes,
      coupon_code: ord.coupon_code || null,
      discount_amount: discountAmount,
    }).select().single()

    if (ordErr) {
      console.log(`  Order error: ${ordErr.message}`)
      continue
    }

    // Insert order_items
    for (const snap of itemsJson) {
      await supabase.from("order_items").insert({
        order_id: created.id,
        product_id: snap.product_id,
        quantity: snap.quantity,
        unit_price: snap.unit_price,
        line_total: snap.line_total,
      })
    }
  }
  console.log(`  ${orderData.length} orders created`)

  // ─── ARTIST AVAILABILITY (next 14 days) ─────────────────
  console.log("\n--- Artist Availability ---")
  const defaultSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
  const availRows = []

  for (const artistId of [IDS.prof_marcus, IDS.prof_jade, IDS.prof_nia, IDS.prof_priya, IDS.prof_tyler]) {
    for (let d = 1; d <= 14; d++) {
      const date = day(d)
      const dayOfWeek = new Date(date).getDay()
      if (dayOfWeek === 0) continue // closed Sundays

      // Vary slots slightly per artist
      let slots = [...defaultSlots]
      if (dayOfWeek === 6) slots = slots.slice(0, 6) // shorter Saturdays

      availRows.push({
        artist_id: artistId,
        date,
        time_slots_json: slots,
      })
    }
  }

  const { error: availErr } = await supabase.from("artist_availability").insert(availRows)
  if (availErr) console.log("  Availability error:", availErr.message)
  else console.log(`  ${availRows.length} availability slots created (5 artists × ~13 days)`)

  // ─── PACKAGES ───────────────────────────────────────────
  console.log("\n--- Packages ---")
  const packages = [
    { name: "First Timer Bundle", description: "Perfect introduction — small tattoo session + aftercare kit + branded tee. Save 15%.", artist_id: IDS.artist_marcus, discount_percent: 15, price: 102, is_active: true },
    { name: "Piercing Party Pack", description: "Choose any 3 piercings + premium jewellery + aftercare solution. Save 20%. Bring friends!", artist_id: IDS.artist_jade, discount_percent: 20, price: 88, is_active: true },
    { name: "Lash & Brow Glow-Up", description: "Volume lash extensions + brow lamination for the ultimate eye transformation. Save 10%.", artist_id: IDS.artist_nia, discount_percent: 10, price: 113, is_active: true },
  ]

  const { error: pkgErr } = await supabase.from("packages").insert(packages)
  if (pkgErr) console.log("  Packages error:", pkgErr.message)
  else console.log(`  ${packages.length} packages created`)

  console.log("\n=== Seed complete ===")
}

seed().catch(err => {
  console.error("Fatal:", err)
  process.exit(1)
})
