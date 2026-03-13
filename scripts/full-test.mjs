/**
 * Full System Test — tests all pages, APIs, and data
 */

const BASE = "http://localhost:3000"

const results = { pass: 0, fail: 0, errors: [] }

async function test(name, fn) {
  try {
    await fn()
    results.pass++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    results.fail++
    results.errors.push({ name, error: err.message })
    console.log(`  ✗ ${name} — ${err.message}`)
  }
}

async function fetchOk(url, opts = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal })
    clearTimeout(timeout)
    return res
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

async function expectPage(path, contains) {
  const res = await fetchOk(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  if (contains && !html.includes(contains)) throw new Error(`Missing: "${contains.slice(0, 50)}"`)
}

async function expectApi(path, opts = {}) {
  const res = await fetchOk(`${BASE}${path}`, opts)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, data }
}

async function main() {
  console.log("=== FULL SYSTEM TEST ===\n")

  // ─── PUBLIC PAGES ───
  console.log("PUBLIC PAGES:")
  await test("Homepage /", () => expectPage("/", "Midnight"))
  await test("/services", () => expectPage("/services", "Tattoo"))
  await test("/products", () => expectPage("/products", "Shop"))
  await test("/gift-cards", () => expectPage("/gift-cards", "Gift"))
  await test("/contact", () => expectPage("/contact"))
  await test("/terms", () => expectPage("/terms"))
  await test("/login", () => expectPage("/login"))
  await test("/artists", () => expectPage("/artists"))
  await test("/book", () => expectPage("/book"))

  // ─── ADMIN PAGES ───
  console.log("\nADMIN PAGES (/dash-admin):")
  await test("/dash-admin", () => expectPage("/dash-admin"))
  await test("/dash-admin/users", () => expectPage("/dash-admin/users", "Users"))
  await test("/dash-admin/services", () => expectPage("/dash-admin/services", "Services"))
  await test("/dash-admin/products", () => expectPage("/dash-admin/products", "Products"))
  await test("/dash-admin/orders", () => expectPage("/dash-admin/orders", "Orders"))
  await test("/dash-admin/packages", () => expectPage("/dash-admin/packages", "Packages"))
  await test("/dash-admin/bulk-sms", () => expectPage("/dash-admin/bulk-sms"))

  // ─── ARTIST PAGES ───
  console.log("\nARTIST PAGES:")
  await test("/artist", () => expectPage("/artist"))
  await test("/artist/calendar", () => expectPage("/artist/calendar"))
  await test("/artist/services", () => expectPage("/artist/services"))
  await test("/artist/orders", () => expectPage("/artist/orders"))
  await test("/artist/messages", () => expectPage("/artist/messages"))

  // ─── CUSTOMER PAGES ───
  console.log("\nCUSTOMER PAGES:")
  await test("/customer/bookings", () => expectPage("/customer/bookings"))
  await test("/customer/orders", () => expectPage("/customer/orders"))
  await test("/customer/profile", () => expectPage("/customer/profile"))
  await test("/customer/shop", () => expectPage("/customer/shop"))
  await test("/customer/cart", () => expectPage("/customer/cart"))

  // ─── DATA APIs ───
  console.log("\nDATA APIs:")

  await test("GET /api/services", async () => {
    const { status, data } = await expectApi("/api/services")
    if (status !== 200) throw new Error(`Status ${status}`)
    if (!Array.isArray(data)) throw new Error("Not array")
    console.log(`    → ${data.length} services`)
  })

  await test("GET /api/services/get-categories", async () => {
    const { status, data } = await expectApi("/api/services/get-categories")
    if (status !== 200) throw new Error(`Status ${status}`)
    const cats = Array.isArray(data) ? data : []
    console.log(`    → ${cats.length} categories: ${cats.map(c => c.name).join(", ")}`)
  })

  await test("GET /api/products/get-all-products", async () => {
    const { status, data } = await expectApi("/api/products/get-all-products")
    if (status !== 200) throw new Error(`Status ${status}`)
    if (!Array.isArray(data)) throw new Error("Not array")
    console.log(`    → ${data.length} products`)
  })

  await test("GET /api/artists", async () => {
    const { status, data } = await expectApi("/api/artists")
    if (status !== 200) throw new Error(`Status ${status}`)
    console.log(`    → ${Array.isArray(data) ? data.length : 0} artists`)
  })

  await test("GET /api/services/get-packages", async () => {
    const { status, data } = await expectApi("/api/services/get-packages")
    if (status !== 200) throw new Error(`Status ${status}`)
    console.log(`    → ${Array.isArray(data) ? data.length : 0} packages`)
  })

  await test("GET /api/test/connections", async () => {
    const { status } = await expectApi("/api/test/connections")
    if (status !== 200) throw new Error(`Status ${status}`)
  })

  // ─── ADMIN APIs ───
  console.log("\nADMIN APIs:")

  await test("POST /api/auth/admin-login", async () => {
    const { status, data } = await expectApi("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "midnight2024" }),
    })
    if (status !== 200) throw new Error(`Login failed: ${status} ${JSON.stringify(data)}`)
  })

  await test("GET /api/admin/stats", async () => {
    const { status, data } = await expectApi("/api/admin/stats")
    // May be 401 without cookie — that's OK, just checking endpoint exists
    if (status === 500) throw new Error(`Server error: ${JSON.stringify(data)}`)
    console.log(`    → status ${status}`)
  })

  // ─── AI APIs (check endpoint exists, not actual generation) ───
  console.log("\nAI APIs (endpoint existence):")

  await test("POST /api/ai/generate-image-prompt (no body)", async () => {
    const { status } = await expectApi("/api/ai/generate-image-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    // Should return 400 for missing fields, not 500
    if (status === 500) throw new Error("Server error")
    console.log(`    → status ${status}`)
  })

  await test("POST /api/ai/generate-image (no body)", async () => {
    const { status } = await expectApi("/api/ai/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (status === 500) throw new Error("Server error")
    console.log(`    → status ${status}`)
  })

  await test("POST /api/ai/generate-poster-suggestions (no body)", async () => {
    const { status } = await expectApi("/api/ai/generate-poster-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (status === 500) throw new Error("Server error")
    console.log(`    → status ${status}`)
  })

  await test("POST /api/packages/suggest-ai (no body)", async () => {
    const { status } = await expectApi("/api/packages/suggest-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (status === 500) throw new Error("Server error")
    console.log(`    → status ${status}`)
  })

  // ─── DATA VALIDATION ───
  console.log("\nDATA VALIDATION:")

  await test("Services have correct Midnight categories", async () => {
    const { data: cats } = await expectApi("/api/services/get-categories")
    const names = (Array.isArray(cats) ? cats : []).map(c => c.name)
    const expected = ["Tattoo", "Piercing", "Eyelash", "Micropigmentation", "Course"]
    const missing = expected.filter(e => !names.includes(e))
    if (missing.length > 0) throw new Error(`Missing categories: ${missing.join(", ")}`)
  })

  await test("Services have prices > 0", async () => {
    const { data: svcs } = await expectApi("/api/services")
    const bad = (Array.isArray(svcs) ? svcs : []).filter(s => !s.base_price || s.base_price <= 0)
    if (bad.length > 0) throw new Error(`${bad.length} services with no price: ${bad.map(s => s.name).join(", ")}`)
  })

  await test("Products include aftercare items", async () => {
    const { data: prods } = await expectApi("/api/products/get-all-products")
    const aftercare = (Array.isArray(prods) ? prods : []).filter(p => p.category === "aftercare")
    if (aftercare.length === 0) throw new Error("No aftercare products found")
    console.log(`    → ${aftercare.length} aftercare products`)
  })

  await test("Gift cards exist in products", async () => {
    const { data: prods } = await expectApi("/api/products/get-all-products")
    const giftCards = (Array.isArray(prods) ? prods : []).filter(p => p.category === "gift_card")
    if (giftCards.length === 0) throw new Error("No gift cards found")
    console.log(`    → ${giftCards.length} gift cards`)
  })

  await test("No duplicate service names", async () => {
    const { data: svcs } = await expectApi("/api/services")
    const names = (Array.isArray(svcs) ? svcs : []).map(s => s.name)
    const dupes = names.filter((n, i) => names.indexOf(n) !== i)
    if (dupes.length > 0) throw new Error(`Duplicates: ${[...new Set(dupes)].join(", ")}`)
  })

  await test("No duplicate product names", async () => {
    const { data: prods } = await expectApi("/api/products/get-all-products")
    const names = (Array.isArray(prods) ? prods : []).map(p => p.name)
    const dupes = names.filter((n, i) => names.indexOf(n) !== i)
    if (dupes.length > 0) throw new Error(`Duplicates: ${[...new Set(dupes)].join(", ")}`)
  })

  // ─── NEW PAGE ROUTES ───
  console.log("\nNEW DETAIL PAGES:")

  await test("/dash-admin/services/[id] route exists", async () => {
    // Use a fake UUID — should return 200 with "not found" message (not 500)
    const res = await fetchOk(`${BASE}/dash-admin/services/00000000-0000-0000-0000-000000000000`)
    if (res.status === 500) throw new Error("Server error on detail page")
    console.log(`    → status ${res.status}`)
  })

  await test("/dash-admin/products/[id] route exists", async () => {
    const res = await fetchOk(`${BASE}/dash-admin/products/00000000-0000-0000-0000-000000000000`)
    if (res.status === 500) throw new Error("Server error on detail page")
    console.log(`    → status ${res.status}`)
  })

  // ─── ORDER ENDPOINTS ───
  console.log("\nORDER ENDPOINTS:")

  await test("POST /api/orders/[id]/accept (fake id)", async () => {
    const { status } = await expectApi("/api/orders/fake-id/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    // Should not be 500 (404 or error message is fine)
    if (status === 500) throw new Error("Server error")
    console.log(`    → status ${status}`)
  })

  await test("POST /api/orders/[id]/decline (fake id)", async () => {
    const { status } = await expectApi("/api/orders/fake-id/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    })
    if (status === 500) throw new Error("Server error")
    console.log(`    → status ${status}`)
  })

  // ─── PACKAGES ENDPOINTS ───
  console.log("\nPACKAGE ENDPOINTS:")

  await test("POST /api/packages/create (empty body)", async () => {
    const { status } = await expectApi("/api/packages/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    // Should return 400 for missing name, not 500
    if (status === 500) throw new Error("Server error")
    console.log(`    → status ${status}`)
  })

  // ─── SUMMARY ───
  console.log("\n" + "=".repeat(50))
  console.log(`RESULTS: ${results.pass} passed, ${results.fail} failed`)
  if (results.errors.length > 0) {
    console.log("\nFAILURES:")
    results.errors.forEach(({ name, error }) => console.log(`  ✗ ${name}: ${error}`))
  }
  console.log("=".repeat(50))

  process.exit(results.fail > 0 ? 1 : 0)
}

main().catch(console.error)
