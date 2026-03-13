/**
 * Seed Data Script for Midnight Studio
 * Run: node scripts/seed-data.mjs
 *
 * Creates:
 * - 3 admin users
 * - 5 artist users with profiles
 * - 3 test customers
 * - 3 test packages with service/product links (if packages table exists)
 * - 5 sample bookings
 * - 3 sample orders with various statuses
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { randomUUID } from "crypto"

// Load .env.local
const envFile = readFileSync(".env.local", "utf-8")
envFile.split("\n").forEach(line => {
  const t = line.trim()
  if (!t || t.startsWith("#")) return
  const eq = t.indexOf("=")
  if (eq === -1) return
  if (!process.env[t.slice(0, eq)]) process.env[t.slice(0, eq)] = t.slice(eq + 1)
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── ADMIN USERS ────────────────────────────────────────
// Actual users columns: id, phone, role, display_name, email, avatar_url, created_at, updated_at

const ADMIN_USERS = [
  {
    id: randomUUID(),
    display_name: "Kiash (Owner)",
    phone: "+447700000001",
    email: "kiash@midnight.studio",
    role: "admin",
  },
  {
    id: randomUUID(),
    display_name: "Sophie Admin",
    phone: "+447700000002",
    email: "sophie@midnight.studio",
    role: "admin",
  },
  {
    id: randomUUID(),
    display_name: "Dev Admin",
    phone: "+447700000003",
    email: "dev@midnight.studio",
    role: "admin",
  },
]

// ─── ARTIST USERS ───────────────────────────────────────

const ARTIST_USERS = [
  {
    id: randomUUID(),
    display_name: "Marcus Ink",
    phone: "+447700100001",
    email: "marcus@midnight.studio",
    role: "artist",
    bio: "Specialist in Japanese and blackwork tattoos with 8 years experience. Known for bold lines and intricate detail.",
    specialties: ["Tattoo"],
  },
  {
    id: randomUUID(),
    display_name: "Jade Pierce",
    phone: "+447700100002",
    email: "jade@midnight.studio",
    role: "artist",
    bio: "Professional body piercer certified in all types. Focused on precision placement and premium titanium jewellery.",
    specialties: ["Piercing"],
  },
  {
    id: randomUUID(),
    display_name: "Nia Lashes",
    phone: "+447700100003",
    email: "nia@midnight.studio",
    role: "artist",
    bio: "Lash artist specialising in volume and mega-volume extensions. Creating natural and dramatic looks since 2019.",
    specialties: ["Eyelash"],
  },
  {
    id: randomUUID(),
    display_name: "Priya Brow",
    phone: "+447700100004",
    email: "priya@midnight.studio",
    role: "artist",
    bio: "Micropigmentation expert — lip blush, microblading and permanent eyeliner. Trained in Seoul, 5+ years experience.",
    specialties: ["Micropigmentation"],
  },
  {
    id: randomUUID(),
    display_name: "Tyler Flash",
    phone: "+447700100005",
    email: "tyler@midnight.studio",
    role: "artist",
    bio: "Fine line and minimalist tattoo specialist. Also teaches the 3-day tattoo course. Focus on clean, delicate work.",
    specialties: ["Tattoo", "Course"],
  },
]

// ─── CUSTOMER USERS (for bookings/orders) ───────────────

const CUSTOMER_USERS = [
  {
    id: randomUUID(),
    display_name: "Emma Test",
    phone: "+447700200001",
    email: "emma@test.com",
    role: "customer",
  },
  {
    id: randomUUID(),
    display_name: "James Test",
    phone: "+447700200002",
    email: "james@test.com",
    role: "customer",
  },
  {
    id: randomUUID(),
    display_name: "Zara Test",
    phone: "+447700200003",
    email: "zara@test.com",
    role: "customer",
  },
]

async function upsertUsers(users, label) {
  let inserted = 0
  let skipped = 0
  for (const user of users) {
    // Separate non-user-table fields
    const { bio, specialties, ...userData } = user
    // Check if user with same email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", userData.email)
      .maybeSingle()

    if (existing) {
      skipped++
      user.id = existing.id
      continue
    }

    const { error } = await supabase.from("users").insert(userData)
    if (error) {
      console.log(`  [${label}] Error inserting ${userData.display_name}: ${error.message}`)
    } else {
      inserted++
    }
  }
  console.log(`[${label}] ${inserted} inserted, ${skipped} already exist`)
}

async function seedArtistProfiles() {
  // artists columns: id, user_id, bio, profile_image, specialties, instagram_url, gcal_email, gcal_token, is_active, created_at, updated_at
  let inserted = 0
  let skipped = 0
  for (const artist of ARTIST_USERS) {
    const { data: existing } = await supabase
      .from("artists")
      .select("id")
      .eq("user_id", artist.id)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const { error } = await supabase.from("artists").insert({
      user_id: artist.id,
      bio: artist.bio,
      specialties: artist.specialties,
      is_active: true,
    })
    if (error) {
      console.log(`  [artist-profile] ${artist.display_name}: ${error.message}`)
    } else {
      inserted++
    }
  }
  console.log(`[Artist profiles] ${inserted} created, ${skipped} already exist`)
}

async function seedPackages() {
  const { error: tableCheck } = await supabase.from("packages").select("id").limit(1)
  if (tableCheck) {
    console.log(`[Packages] Table not available — run DDL SQL in Supabase SQL Editor first`)
    return
  }

  const { data: services } = await supabase.from("services").select("id, name, base_price")
  const { data: products } = await supabase.from("products").select("id, name, price")
  if (!services || !products) {
    console.log("[Packages] No services or products found")
    return
  }

  const svcByName = new Map(services.map(s => [s.name, s]))
  const prodByName = new Map(products.map(p => [p.name, p]))

  const PACKAGES = [
    {
      name: "First Timer Bundle",
      description: "Perfect introduction to Midnight Studio — small tattoo, aftercare kit, and a branded tee.",
      artist_id: ARTIST_USERS[0].id,
      discount_percent: 15,
      is_active: true,
      services: [{ name: "Small Tattoo", quantity: 1, include_free: false }],
      products: [
        { name: "Tattoo Aftercare Kit", quantity: 1, include_free: false },
        { name: "Midnight Branded Tee", quantity: 1, include_free: true },
      ],
    },
    {
      name: "Piercing Party Pack",
      description: "Three piercings in one session with premium jewellery and aftercare solution included.",
      artist_id: ARTIST_USERS[1].id,
      discount_percent: 20,
      is_active: true,
      services: [
        { name: "Any Ear Piercing", quantity: 2, include_free: false },
        { name: "Nose Piercing", quantity: 1, include_free: false },
      ],
      products: [
        { name: "Piercing Care Solution", quantity: 1, include_free: true },
        { name: "Titanium Piercing Jewellery", quantity: 1, include_free: true },
      ],
    },
    {
      name: "Lash & Brow Glow-Up",
      description: "Volume lash extensions plus microblading for the ultimate eye transformation.",
      artist_id: null,
      discount_percent: 10,
      is_active: true,
      services: [
        { name: "Volume Lash Extensions", quantity: 1, include_free: false },
        { name: "Microblading", quantity: 1, include_free: false },
      ],
      products: [],
    },
  ]

  let inserted = 0
  for (const pkg of PACKAGES) {
    const { data: existing } = await supabase
      .from("packages")
      .select("id")
      .eq("name", pkg.name)
      .maybeSingle()

    if (existing) {
      console.log(`  [${pkg.name}] Already exists`)
      continue
    }

    let baseTotal = 0
    for (const s of pkg.services) {
      const svc = svcByName.get(s.name)
      if (svc && !s.include_free) baseTotal += svc.base_price * s.quantity
    }
    for (const p of pkg.products) {
      const prod = prodByName.get(p.name)
      if (prod && !p.include_free) baseTotal += prod.price * p.quantity
    }
    const price = Math.round(baseTotal * (1 - pkg.discount_percent / 100))

    const { data: created, error } = await supabase
      .from("packages")
      .insert({
        name: pkg.name,
        description: pkg.description,
        artist_id: pkg.artist_id,
        discount_percent: pkg.discount_percent,
        price,
        is_active: pkg.is_active,
      })
      .select()
      .single()

    if (error) {
      console.log(`  [${pkg.name}] Error: ${error.message}`)
      continue
    }

    for (const s of pkg.services) {
      const svc = svcByName.get(s.name)
      if (!svc) continue
      await supabase.from("package_services").insert({
        package_id: created.id,
        service_id: svc.id,
        quantity: s.quantity,
        include_free: s.include_free,
      })
    }

    for (const p of pkg.products) {
      const prod = prodByName.get(p.name)
      if (!prod) continue
      await supabase.from("package_products").insert({
        package_id: created.id,
        product_id: prod.id,
        quantity: p.quantity,
        include_free: p.include_free,
      })
    }

    inserted++
    console.log(`  [${pkg.name}] Created — £${price}`)
  }
  console.log(`[Packages] ${inserted} created`)
}

async function seedBookings() {
  // bookings.artist_id references artists.id (NOT users.id)
  // So we need to look up artist table IDs by user_id
  const { data: services } = await supabase.from("services").select("id, name, base_price, duration")
  const { data: artists } = await supabase.from("artists").select("id, user_id")
  if (!services || services.length === 0) {
    console.log("[Bookings] No services found")
    return
  }
  if (!artists || artists.length === 0) {
    console.log("[Bookings] No artists found")
    return
  }

  const svcByName = new Map(services.map(s => [s.name, s]))
  // Map user_id → artist table id
  const artistIdByUserId = new Map(artists.map(a => [a.user_id, a.id]))

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split("T")[0]
  const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0]
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0]
  const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0]

  const BOOKINGS = [
    {
      customer_id: CUSTOMER_USERS[0].id,
      artist_user_id: ARTIST_USERS[0].id,
      service_name: "Small Tattoo",
      booking_date: tomorrow,
      booking_time: "10:00",
      status: "confirmed",
    },
    {
      customer_id: CUSTOMER_USERS[1].id,
      artist_user_id: ARTIST_USERS[1].id,
      service_name: "Nose Piercing",
      booking_date: tomorrow,
      booking_time: "14:00",
      status: "pending",
    },
    {
      customer_id: CUSTOMER_USERS[2].id,
      artist_user_id: ARTIST_USERS[2].id,
      service_name: "Volume Lash Extensions",
      booking_date: nextWeek,
      booking_time: "11:00",
      status: "pending",
    },
    {
      customer_id: CUSTOMER_USERS[0].id,
      artist_user_id: ARTIST_USERS[4].id,
      service_name: "Fine Line Tattoo",
      booking_date: yesterday,
      booking_time: "15:00",
      status: "completed",
    },
    {
      customer_id: CUSTOMER_USERS[1].id,
      artist_user_id: ARTIST_USERS[3].id,
      service_name: "Lip Blush",
      booking_date: lastWeek,
      booking_time: "13:00",
      status: "completed",
    },
  ]

  const { count } = await supabase.from("bookings").select("id", { count: "exact", head: true })
  if (count && count >= 5) {
    console.log(`[Bookings] Already have ${count} bookings — skipping`)
    return
  }

  let inserted = 0
  for (const b of BOOKINGS) {
    const svc = svcByName.get(b.service_name)
    if (!svc) {
      console.log(`  [booking] Service not found: ${b.service_name}`)
      continue
    }

    const artistId = artistIdByUserId.get(b.artist_user_id)
    if (!artistId) {
      console.log(`  [booking] Artist not found for user_id: ${b.artist_user_id}`)
      continue
    }

    const { error } = await supabase.from("bookings").insert({
      customer_id: b.customer_id,
      artist_id: artistId,
      service_id: svc.id,
      booking_date: b.booking_date,
      booking_time: b.booking_time,
      duration_minutes: svc.duration,
      total_price: svc.base_price,
      status: b.status,
    })

    if (error) {
      console.log(`  [booking] Error: ${error.message}`)
    } else {
      inserted++
    }
  }
  console.log(`[Bookings] ${inserted} created`)
}

async function seedOrders() {
  // orders columns: customer_id, order_date, total_price, status, items_json, shipping_address, notes
  // (accepted_at, declined_at, decline_reason may not exist yet — DDL needed)
  const { data: products } = await supabase.from("products").select("id, name, price")
  if (!products || products.length === 0) {
    console.log("[Orders] No products found")
    return
  }

  const prodByName = new Map(products.map(p => [p.name, p]))

  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true })
  if (count && count >= 3) {
    console.log(`[Orders] Already have ${count} orders — skipping`)
    return
  }

  const now = new Date()

  const ORDERS = [
    {
      customer_id: CUSTOMER_USERS[0].id,
      status: "pending",
      items: [
        { name: "Tattoo Aftercare Kit", qty: 1 },
        { name: "SPF50 Tattoo Sunscreen", qty: 2 },
      ],
      notes: "Please deliver to reception",
      order_date: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      customer_id: CUSTOMER_USERS[1].id,
      status: "processing",
      items: [{ name: "Gift Card — £100", qty: 1 }],
      notes: "Birthday gift for my sister",
      order_date: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      customer_id: CUSTOMER_USERS[2].id,
      status: "pending",
      items: [
        { name: "Piercing Care Solution", qty: 3 },
        { name: "Titanium Piercing Jewellery", qty: 2 },
      ],
      notes: null,
      order_date: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
  ]

  let inserted = 0
  for (const order of ORDERS) {
    const itemsJson = []
    let totalPrice = 0
    for (const item of order.items) {
      const prod = prodByName.get(item.name)
      if (!prod) {
        console.log(`  [order] Product not found: ${item.name}`)
        continue
      }
      const lineTotal = prod.price * item.qty
      totalPrice += lineTotal
      itemsJson.push({
        name: prod.name,
        product_id: prod.id,
        quantity: item.qty,
        unit_price: prod.price,
        line_total: lineTotal,
      })
    }

    const { data: created, error } = await supabase
      .from("orders")
      .insert({
        customer_id: order.customer_id,
        order_date: order.order_date,
        total_price: totalPrice,
        status: order.status,
        items_json: itemsJson,
        notes: order.notes,
      })
      .select()
      .single()

    if (error) {
      console.log(`  [order] Error: ${error.message}`)
      continue
    }

    // Insert order_items
    for (const snap of itemsJson) {
      await supabase.from("order_items").insert({
        order_id: created.id,
        product_id: snap.product_id,
        quantity: snap.quantity,
        unit_price: snap.unit_price,
      })
    }

    inserted++
  }
  console.log(`[Orders] ${inserted} created`)
}

// ─── MAIN ───────────────────────────────────────────────

async function main() {
  console.log("=== Midnight Studio — Seed Data ===\n")

  // 1. Users
  console.log("--- Users ---")
  await upsertUsers(ADMIN_USERS, "Admin users")
  await upsertUsers(ARTIST_USERS, "Artist users")
  await upsertUsers(CUSTOMER_USERS, "Customer users")

  // 2. Artist profiles
  console.log("\n--- Artist Profiles ---")
  await seedArtistProfiles()

  // 3. Packages
  console.log("\n--- Packages ---")
  await seedPackages()

  // 4. Bookings
  console.log("\n--- Bookings ---")
  await seedBookings()

  // 5. Orders
  console.log("\n--- Orders ---")
  await seedOrders()

  console.log("\n=== Seed complete ===")
}

main().catch(console.error)
