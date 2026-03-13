/**
 * Add Kia — Owner & Lead Artist at MidNight Tattoo & Piercing
 * Run: node scripts/add-kia-artist.cjs
 */

const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const { randomUUID } = require("crypto")

// Load .env.local
const env = {}
fs.readFileSync(".env.local", "utf-8").split("\n").forEach(line => {
  const t = line.trim()
  if (!t || t.startsWith("#")) return
  const eq = t.indexOf("=")
  if (eq === -1) return
  env[t.slice(0, eq)] = t.slice(eq + 1)
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const USER_ID = randomUUID()
const ARTIST_ID = randomUUID()

async function main() {
  console.log("=== Adding Kia — Owner & Lead Artist ===\n")

  // 1. Create user record
  console.log("--- Creating user ---")
  const { error: userErr } = await supabase.from("users").insert({
    id: USER_ID,
    display_name: "Kia",
    phone: "+447958747929",
    email: "kia@midnightt.top",
    role: "artist",
  })
  if (userErr) {
    // If phone already exists, fetch the existing user
    if (userErr.message.includes("duplicate")) {
      console.log("  User already exists, fetching...")
      const { data } = await supabase.from("users").select("id").eq("phone", "+447958747929").single()
      if (data) {
        console.log("  Found existing user:", data.id)
        // Update to artist role
        await supabase.from("users").update({ role: "artist", display_name: "Kia", email: "kia@midnightt.top" }).eq("id", data.id)
        // Use existing user ID for artist profile
        return createArtistProfile(data.id)
      }
    }
    console.log("  User error:", userErr.message)
    return
  }
  console.log("  User created:", USER_ID)

  await createArtistProfile(USER_ID)
}

async function createArtistProfile(userId) {
  // 2. Create artist profile
  console.log("\n--- Creating artist profile ---")
  const { error: artistErr } = await supabase.from("artists").insert({
    id: ARTIST_ID,
    user_id: userId,
    bio: "Kia is the owner and lead artist at MidNight Tattoo & Piercing with over 13 years of experience. Known as the 'master of tattoo speed', Kia specialises in custom designs, fine line work, realism, blackwork, and bold traditional pieces. From intricate single-needle portraits to full sleeves, Kia brings precision and artistry to every session. Based in Camden Town, London — now expanding to serve clients worldwide through midnightt.top.",
    profile_image: null,
    specialties: [
      "Custom Design",
      "Fine Line",
      "Realism",
      "Blackwork",
      "Traditional",
      "Full Sleeve",
      "Portraits",
      "Cover-ups",
      "Piercing"
    ],
    instagram_url: "https://www.instagram.com/midnight.tats/",
    is_active: true,
  })
  if (artistErr) {
    console.log("  Artist profile error:", artistErr.message)
    return
  }
  console.log("  Artist profile created:", ARTIST_ID)

  // 3. Add Kia's services
  console.log("\n--- Adding Kia's services ---")

  // Get category IDs
  const { data: categories } = await supabase.from("service_categories").select("id, name")
  const catMap = {}
  if (categories) {
    categories.forEach(c => { catMap[c.name.toLowerCase()] = c.id })
  }

  const tattooCategory = catMap["tattoo"] || catMap["tattoos"] || null
  const piercingCategory = catMap["piercing"] || catMap["piercings"] || null

  const services = [
    // Tattoo services
    {
      name: "Consultation & Custom Design",
      description: "Free consultation with Kia to discuss your tattoo vision, placement, and design. Includes a custom sketch session.",
      category_id: tattooCategory,
      artist_id: ARTIST_ID,
      base_price: 0,
      duration: 15,
      is_active: true,
    },
    {
      name: "Budget Tattoo",
      description: "Small to medium designs, perfect for first tattoos or simple flash pieces. Clean lines and solid work guaranteed.",
      category_id: tattooCategory,
      artist_id: ARTIST_ID,
      base_price: 100,
      duration: 60,
      is_active: true,
    },
    {
      name: "Mid-Size Custom Tattoo",
      description: "Custom designed pieces, 1-1.5 hours of work. Perfect for detailed forearm, upper arm, or calf pieces.",
      category_id: tattooCategory,
      artist_id: ARTIST_ID,
      base_price: 150,
      duration: 90,
      is_active: true,
    },
    {
      name: "Advanced Tattoo (up to 4.5\")",
      description: "Larger, more complex custom pieces. Detailed realism, portraits, or intricate blackwork up to 4.5 inches.",
      category_id: tattooCategory,
      artist_id: ARTIST_ID,
      base_price: 250,
      duration: 150,
      is_active: true,
    },
    {
      name: "Matching Tattoo (Pair)",
      description: "Couples, best friends, or family matching tattoos. Price is per person. Coordinated designs by Kia.",
      category_id: tattooCategory,
      artist_id: ARTIST_ID,
      base_price: 120,
      duration: 60,
      is_active: true,
    },
    {
      name: "VIP On-Tour Session (2-4 hrs)",
      description: "Extended premium session for large-scale work. Full sleeves, back pieces, or multi-area sessions. Kia's signature experience.",
      category_id: tattooCategory,
      artist_id: ARTIST_ID,
      base_price: 600,
      duration: 240,
      is_active: true,
    },
    // Piercing services
    {
      name: "Ear Lobe Piercing (Single)",
      description: "Professional single ear lobe piercing with high-quality titanium jewellery. Quick and virtually painless.",
      category_id: piercingCategory,
      artist_id: ARTIST_ID,
      base_price: 12.99,
      duration: 15,
      is_active: true,
    },
    {
      name: "Ear Piercing (Helix/Tragus/Conch)",
      description: "Cartilage ear piercings including helix, tragus, conch, and daith. Premium titanium jewellery included.",
      category_id: piercingCategory,
      artist_id: ARTIST_ID,
      base_price: 55,
      duration: 20,
      is_active: true,
    },
    {
      name: "Facial Piercing (Nose/Septum/Lip)",
      description: "Professional facial piercings — nostril, septum, lip, monroe, medusa. Includes titanium jewellery.",
      category_id: piercingCategory,
      artist_id: ARTIST_ID,
      base_price: 60,
      duration: 20,
      is_active: true,
    },
    {
      name: "Specialised Piercing (Navel/Nipple/Surface)",
      description: "Specialised body piercings including navel, nipple, and surface piercings. Premium titanium jewellery.",
      category_id: piercingCategory,
      artist_id: ARTIST_ID,
      base_price: 65,
      duration: 25,
      is_active: true,
    },
    {
      name: "Baby Ear Piercing (Pair)",
      description: "Gentle ear lobe piercing for children, done with care and precision. Hypoallergenic titanium studs included.",
      category_id: piercingCategory,
      artist_id: ARTIST_ID,
      base_price: 22.99,
      duration: 15,
      is_active: true,
    },
    {
      name: "Jewellery Fix / Change",
      description: "Quick jewellery swap or fix for existing piercings. Bring your own or choose from our selection.",
      category_id: piercingCategory,
      artist_id: ARTIST_ID,
      base_price: 10,
      duration: 10,
      is_active: true,
    },
  ]

  const { error: servicesErr } = await supabase.from("services").insert(services)
  if (servicesErr) console.log("  Services error:", servicesErr.message)
  else console.log(`  ${services.length} services created for Kia`)

  // 4. Add availability (next 14 days, 11am-11pm daily)
  console.log("\n--- Adding availability ---")
  const availability = []
  const today = new Date()

  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split("T")[0]

    // Generate hourly slots from 11:00 to 22:00
    const slots = []
    for (let h = 11; h <= 22; h++) {
      const hour = h.toString().padStart(2, "0")
      slots.push({ time: `${hour}:00`, available: true })
    }

    availability.push({
      artist_id: ARTIST_ID,
      date: dateStr,
      time_slots_json: slots,
    })
  }

  const { error: availErr } = await supabase.from("artist_availability").insert(availability)
  if (availErr) console.log("  Availability error:", availErr.message)
  else console.log(`  ${availability.length} days of availability created`)

  console.log("\n=== Done! ===")
  console.log(`  User ID:   ${userId}`)
  console.log(`  Artist ID: ${ARTIST_ID}`)
  console.log(`  Phone:     +447958747929`)
  console.log(`  Instagram: @midnight.tats`)
  console.log(`  Website:   midnightt.top`)
  console.log(`  Services:  ${services.length} created`)
}

main().catch(console.error)
