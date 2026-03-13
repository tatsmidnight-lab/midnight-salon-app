/**
 * Database migration for Admin V2 redesign
 * Run: node scripts/migrate-admin-v2.mjs
 *
 * Adds:
 * - marketing_suggestions JSONB to services & products
 * - decline_reason, accepted_at, declined_at to orders
 * - Creates marketing-posters & avatars buckets
 * - Creates packages, package_services, package_products tables if missing
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

// Load .env.local manually (no dotenv dependency)
const envFile = readFileSync(".env.local", "utf-8")
envFile.split("\n").forEach(line => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return
  const eqIdx = trimmed.indexOf("=")
  if (eqIdx === -1) return
  const key = trimmed.slice(0, eqIdx)
  const val = trimmed.slice(eqIdx + 1)
  if (!process.env[key]) process.env[key] = val
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runSQL(sql, label) {
  const { error } = await supabase.rpc("exec_sql", { sql_query: sql }).maybeSingle()
  if (error) {
    // Try via REST if exec_sql doesn't exist
    console.log(`[${label}] RPC not available, trying direct...`)
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql_query: sql }),
    })
    if (!res.ok) {
      console.log(`[${label}] ⚠️  Manual SQL needed: ${sql.slice(0, 80)}...`)
      return false
    }
  }
  console.log(`[${label}] ✓ Done`)
  return true
}

async function main() {
  console.log("=== Admin V2 Migration ===\n")

  // 1. Add columns to services
  const migrations = [
    {
      label: "services.marketing_suggestions",
      sql: `ALTER TABLE services ADD COLUMN IF NOT EXISTS marketing_suggestions JSONB DEFAULT '[]'::jsonb;`,
    },
    {
      label: "products.marketing_suggestions",
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS marketing_suggestions JSONB DEFAULT '[]'::jsonb;`,
    },
    {
      label: "orders.decline_reason",
      sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS decline_reason TEXT;`,
    },
    {
      label: "orders.accepted_at",
      sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;`,
    },
    {
      label: "orders.declined_at",
      sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;`,
    },
    {
      label: "users.avatar_url",
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`,
    },
    {
      label: "packages table",
      sql: `CREATE TABLE IF NOT EXISTS packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        artist_id UUID REFERENCES users(id),
        discount_percent NUMERIC DEFAULT 0,
        price NUMERIC,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      );`,
    },
    {
      label: "package_services table",
      sql: `CREATE TABLE IF NOT EXISTS package_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
        service_id UUID REFERENCES services(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        include_free BOOLEAN DEFAULT false
      );`,
    },
    {
      label: "package_products table",
      sql: `CREATE TABLE IF NOT EXISTS package_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        include_free BOOLEAN DEFAULT false
      );`,
    },
  ]

  let manualSQL = []
  for (const m of migrations) {
    const ok = await runSQL(m.sql, m.label)
    if (!ok) manualSQL.push(m)
  }

  // 2. Create storage buckets
  console.log("\n--- Storage Buckets ---")
  for (const bucket of ["marketing-posters", "avatars"]) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    })
    if (error && error.message?.includes("already exists")) {
      console.log(`[${bucket}] Already exists`)
    } else if (error) {
      console.log(`[${bucket}] ⚠️ ${error.message}`)
    } else {
      console.log(`[${bucket}] ✓ Created`)
    }
  }

  if (manualSQL.length > 0) {
    console.log("\n⚠️  Run these manually in Supabase SQL Editor:\n")
    manualSQL.forEach((m) => console.log(`-- ${m.label}\n${m.sql}\n`))
  }

  console.log("\n=== Migration complete ===")
}

main().catch(console.error)
