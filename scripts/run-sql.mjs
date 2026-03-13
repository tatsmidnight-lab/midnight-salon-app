import { readFileSync } from "fs"

// Load env
const envFile = readFileSync(".env.local", "utf-8")
envFile.split("\n").forEach(line => {
  const t = line.trim()
  if (!t || t.startsWith("#")) return
  const eq = t.indexOf("=")
  if (eq === -1) return
  if (!process.env[t.slice(0, eq)]) process.env[t.slice(0, eq)] = t.slice(eq + 1)
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const SQL_STATEMENTS = [
  `ALTER TABLE services ADD COLUMN IF NOT EXISTS marketing_suggestions JSONB DEFAULT '[]'::jsonb`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS marketing_suggestions JSONB DEFAULT '[]'::jsonb`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS decline_reason TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
  `CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    artist_id UUID REFERENCES users(id),
    discount_percent NUMERIC DEFAULT 0,
    price NUMERIC,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS package_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    include_free BOOLEAN DEFAULT false
  )`,
  `CREATE TABLE IF NOT EXISTS package_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    include_free BOOLEAN DEFAULT false
  )`,
]

async function runSQL(sql, label) {
  // Use Supabase Management API's SQL endpoint
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({}),
  })

  // That won't work for DDL. Try the pg_net approach or just use
  // the Supabase client's from("").select() to check if columns exist
  return false
}

// Alternative: Use supabase-js to test if tables/columns exist
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log("=== Running SQL via Supabase ===\n")

  // Check current state
  console.log("Checking current schema...\n")

  // Test services table columns
  const { data: svc, error: svcErr } = await supabase.from("services").select("id, marketing_suggestions").limit(1)
  if (svcErr && svcErr.message.includes("marketing_suggestions")) {
    console.log("services.marketing_suggestions: MISSING — needs SQL Editor")
  } else {
    console.log("services.marketing_suggestions: EXISTS ✓")
  }

  const { data: prod, error: prodErr } = await supabase.from("products").select("id, marketing_suggestions").limit(1)
  if (prodErr && prodErr.message.includes("marketing_suggestions")) {
    console.log("products.marketing_suggestions: MISSING — needs SQL Editor")
  } else {
    console.log("products.marketing_suggestions: EXISTS ✓")
  }

  const { data: ord, error: ordErr } = await supabase.from("orders").select("id, decline_reason, accepted_at, declined_at").limit(1)
  if (ordErr) {
    console.log("orders columns: MISSING — " + ordErr.message)
  } else {
    console.log("orders.decline_reason/accepted_at/declined_at: EXISTS ✓")
  }

  const { data: usr, error: usrErr } = await supabase.from("users").select("id, avatar_url").limit(1)
  if (usrErr && usrErr.message.includes("avatar_url")) {
    console.log("users.avatar_url: MISSING — needs SQL Editor")
  } else {
    console.log("users.avatar_url: EXISTS ✓")
  }

  // Check packages table
  const { data: pkg, error: pkgErr } = await supabase.from("packages").select("id").limit(1)
  if (pkgErr) {
    console.log("packages table: MISSING — " + pkgErr.message)
  } else {
    console.log("packages table: EXISTS ✓")
  }

  const { data: pkgSvc, error: pkgSvcErr } = await supabase.from("package_services").select("id").limit(1)
  if (pkgSvcErr) {
    console.log("package_services table: MISSING — " + pkgSvcErr.message)
  } else {
    console.log("package_services table: EXISTS ✓")
  }

  const { data: pkgProd, error: pkgProdErr } = await supabase.from("package_products").select("id").limit(1)
  if (pkgProdErr) {
    console.log("package_products table: MISSING — " + pkgProdErr.message)
  } else {
    console.log("package_products table: EXISTS ✓")
  }

  // Check buckets
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketNames = (buckets || []).map(b => b.name)
  console.log("\nStorage buckets:", bucketNames.join(", "))
  console.log("marketing-posters:", bucketNames.includes("marketing-posters") ? "EXISTS ✓" : "MISSING")
  console.log("avatars:", bucketNames.includes("avatars") ? "EXISTS ✓" : "MISSING")

  console.log("\n=== If columns are MISSING, run this in Supabase SQL Editor ===")
  console.log(`
${SQL_STATEMENTS.join(";\n\n")};
`)
}

main().catch(console.error)
