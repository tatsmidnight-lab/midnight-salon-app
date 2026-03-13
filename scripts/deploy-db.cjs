const pg = require("pg")
const dns = require("dns")
const fs = require("fs")

// Force IPv4 (WSL2 can't reach IPv6)
dns.setDefaultResultOrder("ipv4first")

const envFile = fs.readFileSync(".env.local", "utf-8")
const env = {}
envFile.split("\n").forEach(line => {
  const t = line.trim()
  if (!t || t.startsWith("#")) return
  const eq = t.indexOf("=")
  if (eq === -1) return
  env[t.slice(0, eq)] = t.slice(eq + 1)
})

const ref = "cxvjfgnetidthnlyrumy"

// Connection configs to try: direct host, then pooler (transaction & session mode)
function getConfigs(password) {
  return [
    { host: `db.${ref}.supabase.co`, port: 5432, user: "postgres" },
    { host: `aws-0-eu-west-2.pooler.supabase.com`, port: 5432, user: `postgres.${ref}` },
    { host: `aws-0-eu-west-1.pooler.supabase.com`, port: 5432, user: `postgres.${ref}` },
    { host: `aws-0-us-east-1.pooler.supabase.com`, port: 5432, user: `postgres.${ref}` },
  ].map(c => ({ ...c, database: "postgres", password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 }))
}

async function tryConnect(password, label) {
  const configs = getConfigs(password)
  for (const config of configs) {
    const client = new pg.Client(config)
    try {
      await client.connect()
      await client.query("SELECT 1 as test")
      console.log(`${label} @ ${config.host}: CONNECTED`)
      return client
    } catch (err) {
      console.log(`${label} @ ${config.host}: ${err.message.slice(0, 80)}`)
      try { await client.end() } catch {}
    }
  }
  return null
}

async function main() {
  // Try different passwords
  let client = await tryConnect(env.SUPABASE_JWT_SECRET, "JWT_SECRET")
  if (!client) client = await tryConnect(env.SUPABASE_SERVICE_ROLE_KEY, "SERVICE_KEY")
  if (!client) client = await tryConnect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "ANON_KEY")

  if (!client) {
    console.log("\nCould not connect with any known key.")
    console.log("Your Supabase DB password is needed. Find it in:")
    console.log("  Supabase Dashboard > Project Settings > Database > Connection string")
    console.log("\nOr paste this SQL in Supabase SQL Editor (dashboard.supabase.com):\n")
    printSQL()
    process.exit(1)
  }

  const SQL_STATEMENTS = getStatements()

  console.log("\n=== Running DDL migrations ===\n")

  let success = 0
  let failed = 0
  for (const sql of SQL_STATEMENTS) {
    const label = sql.slice(0, 60).replace(/\s+/g, " ")
    try {
      await client.query(sql)
      console.log(`  OK: ${label}...`)
      success++
    } catch (err) {
      console.log(`  FAIL: ${label}... - ${err.message}`)
      failed++
    }
  }

  console.log(`\n=== Done: ${success} succeeded, ${failed} failed ===`)
  await client.end()
}

function printSQL() {
  const stmts = getStatements()
  console.log("-- Midnight Studio DB Migration")
  console.log("-- Copy everything below and paste in Supabase SQL Editor\n")
  stmts.forEach(s => console.log(s + ";\n"))
}

function getStatements() {
  return [
    `ALTER TABLE services ADD COLUMN IF NOT EXISTS marketing_suggestions JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS marketing_suggestions JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS decline_reason TEXT`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ`,
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
    `ALTER TABLE packages ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'packages_public_read') THEN
        CREATE POLICY packages_public_read ON packages FOR SELECT USING (true);
      END IF;
    END $$`,
    `ALTER TABLE package_services ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'package_services' AND policyname = 'pkg_svc_public_read') THEN
        CREATE POLICY pkg_svc_public_read ON package_services FOR SELECT USING (true);
      END IF;
    END $$`,
    `ALTER TABLE package_products ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'package_products' AND policyname = 'pkg_prod_public_read') THEN
        CREATE POLICY pkg_prod_public_read ON package_products FOR SELECT USING (true);
      END IF;
    END $$`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id),
      quantity INTEGER DEFAULT 1,
      unit_price NUMERIC,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,
    `ALTER TABLE order_items ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'order_items_public_read') THEN
        CREATE POLICY order_items_public_read ON order_items FOR SELECT USING (true);
      END IF;
    END $$`,
  ]
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
