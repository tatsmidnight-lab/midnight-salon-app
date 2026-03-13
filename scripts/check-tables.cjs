const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")

const env = {}
fs.readFileSync(".env.local", "utf-8").split("\n").forEach(l => {
  const t = l.trim()
  if (!t || t.startsWith("#")) return
  const eq = t.indexOf("=")
  if (eq === -1) return
  env[t.slice(0, eq)] = t.slice(eq + 1)
})

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const tables = [
  "users", "artists", "services", "service_categories", "products",
  "bookings", "orders", "messages", "artist_availability", "service_variants",
  "packages", "package_services", "package_products", "order_items", "coupons"
]

async function main() {
  console.log("=== Checking Supabase tables ===\n")
  for (const t of tables) {
    const { data, error } = await sb.from(t).select("id").limit(1)
    const status = error ? "MISSING" : `EXISTS (${data.length} sample rows)`
    console.log(`  ${t}: ${status}`)
  }
}

main()
