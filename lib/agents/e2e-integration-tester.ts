// E2E Integration Tester for Midnight Studio Salon App
// Tests end-to-end user flows combining frontend pages and backend APIs.
// Pure TypeScript, no external dependencies. Uses native fetch with AbortController.

export interface E2EStep {
  name: string
  status: "pass" | "fail"
  detail?: string
}

export interface E2ETestResult {
  flow: string
  status: "pass" | "fail"
  steps: E2EStep[]
  duration: number
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 10_000

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
}

function icon(status: "pass" | "fail"): string {
  return status === "pass"
    ? `${colors.green}[PASS]${colors.reset}`
    : `${colors.red}[FAIL]${colors.reset}`
}

async function timedFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

async function fetchText(url: string, init?: RequestInit): Promise<{ res: Response; text: string }> {
  const res = await timedFetch(url, init)
  const text = await res.text()
  return { res, text }
}

async function fetchJson(url: string, init?: RequestInit): Promise<{ res: Response; data: unknown }> {
  const res = await timedFetch(url, init)
  const data = await res.json()
  return { res, data }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

// ---------------------------------------------------------------------------
// Flow runners
// ---------------------------------------------------------------------------

type FlowFn = (baseUrl: string, opts: { verbose: boolean; adminPassword: string }) => Promise<E2EStep[]>

// Flow 1: Public Browsing ───────────────────────────────────────────────────

const publicBrowsing: FlowFn = async (baseUrl) => {
  const steps: E2EStep[] = []

  // 1. Homepage
  {
    const name = "Load homepage (200 + contains 'Midnight')"
    try {
      const { res, text } = await fetchText(baseUrl)
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      assert(
        text.toLowerCase().includes("midnight"),
        "Homepage does not contain 'Midnight'"
      )
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 2. /services page
  {
    const name = "Navigate to /services page"
    try {
      const { res } = await fetchText(`${baseUrl}/services`)
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 3. GET /api/services
  {
    const name = "GET /api/services returns services array"
    try {
      const { res, data } = await fetchJson(`${baseUrl}/api/services`)
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      assert(Array.isArray(data), "Response is not an array")
      steps.push({ name, status: "pass", detail: `${(data as unknown[]).length} services` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 4. GET /api/services/get-categories → 5 categories
  {
    const name = "GET /api/services/get-categories returns 5 categories"
    try {
      const { res, data } = await fetchJson(`${baseUrl}/api/services/get-categories`)
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      assert(Array.isArray(data), "Response is not an array")
      assert(
        (data as unknown[]).length === 5,
        `Expected 5 categories, got ${(data as unknown[]).length}`
      )
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 5. /products page
  {
    const name = "Navigate to /products page"
    try {
      const { res } = await fetchText(`${baseUrl}/products`)
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 6. GET /api/products/get-all-products
  {
    const name = "GET /api/products/get-all-products returns products array"
    try {
      const { res, data } = await fetchJson(`${baseUrl}/api/products/get-all-products`)
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      assert(Array.isArray(data), "Response is not an array")
      steps.push({ name, status: "pass", detail: `${(data as unknown[]).length} products` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  return steps
}

// Flow 2: Admin Login & Dashboard ──────────────────────────────────────────

const adminLoginDashboard: FlowFn = async (baseUrl, { adminPassword }) => {
  const steps: E2EStep[] = []
  let cookie = ""

  // 1. POST /api/auth/admin-login
  {
    const name = "POST /api/auth/admin-login with valid creds"
    try {
      const res = await timedFetch(`${baseUrl}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      })
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      // Capture set-cookie for subsequent requests
      const setCookie = res.headers.get("set-cookie")
      if (setCookie) cookie = setCookie.split(";")[0]
      const body = await res.json()
      assert(
        body.token || body.session || body.success || setCookie,
        "Response missing token/session/success"
      )
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  const authHeaders: Record<string, string> = cookie ? { Cookie: cookie } : {}

  // 2. GET /dash-admin
  {
    const name = "GET /dash-admin page loads"
    try {
      const { res } = await fetchText(`${baseUrl}/dash-admin`, { headers: authHeaders })
      // Accept 200 or 307/302 redirect (auth may redirect)
      assert(res.status < 500, `Server error ${res.status}`)
      steps.push({ name, status: "pass", detail: `status ${res.status}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 3. GET /api/admin/stats
  {
    const name = "GET /api/admin/stats returns stats object"
    try {
      const { res, data } = await fetchJson(`${baseUrl}/api/admin/stats`, { headers: authHeaders })
      assert(res.status < 500, `Server error ${res.status}`)
      if (res.status === 200) {
        assert(typeof data === "object" && data !== null, "Expected stats object")
      }
      steps.push({ name, status: "pass", detail: `status ${res.status}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 4-6. Admin sub-pages
  for (const [path, keyword] of [
    ["/dash-admin/users", "Users"],
    ["/dash-admin/services", "Services"],
    ["/dash-admin/orders", "Orders"],
  ] as const) {
    const name = `GET ${path} contains "${keyword}"`
    try {
      const { res, text } = await fetchText(`${baseUrl}${path}`, { headers: authHeaders })
      assert(res.status < 500, `Server error ${res.status}`)
      // Keyword may appear in the HTML or in JS bundles
      assert(
        text.toLowerCase().includes(keyword.toLowerCase()),
        `Page does not contain "${keyword}"`
      )
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  return steps
}

// Flow 3: Service Data Integrity ───────────────────────────────────────────

const serviceDataIntegrity: FlowFn = async (baseUrl) => {
  const steps: E2EStep[] = []

  let categories: { id: string; name: string }[] = []
  let services: Record<string, unknown>[] = []

  // 1. Fetch all categories (5)
  {
    const name = "Fetch categories: exactly 5 exist"
    try {
      const { data } = await fetchJson(`${baseUrl}/api/services/get-categories`)
      assert(Array.isArray(data), "Not an array")
      categories = data as typeof categories
      assert(categories.length === 5, `Expected 5 categories, got ${categories.length}`)
      steps.push({ name, status: "pass", detail: categories.map((c) => c.name).join(", ") })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 2. Fetch all services (>= 29)
  {
    const name = "Fetch services: count >= 29"
    try {
      const { data } = await fetchJson(`${baseUrl}/api/services`)
      assert(Array.isArray(data), "Not an array")
      services = data as typeof services
      assert(services.length >= 29, `Expected >= 29 services, got ${services.length}`)
      steps.push({ name, status: "pass", detail: `${services.length} services` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 3. Each service has required fields
  {
    const name = "Each service has name, base_price > 0, duration > 0, category_id"
    try {
      for (const svc of services) {
        const svcName = svc.name as string
        assert(typeof svc.name === "string" && svc.name !== "", `Service missing name`)
        assert(
          typeof svc.base_price === "number" && (svc.base_price as number) > 0,
          `Service "${svcName}" has invalid base_price: ${svc.base_price}`
        )
        assert(
          typeof svc.duration === "number" && (svc.duration as number) > 0,
          `Service "${svcName}" has invalid duration: ${svc.duration}`
        )
        assert(
          svc.category_id != null,
          `Service "${svcName}" missing category_id`
        )
      }
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 4. No duplicate service names
  {
    const name = "No duplicate service names"
    try {
      const names = services.map((s) => (s.name as string).toLowerCase())
      const dupes = names.filter((n, i) => names.indexOf(n) !== i)
      assert(dupes.length === 0, `Duplicate names: ${Array.from(new Set(dupes)).join(", ")}`)
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 5. All categories have services assigned
  {
    const name = "All categories have at least one service"
    try {
      const categoryIds = new Set(services.map((s) => s.category_id as string))
      for (const cat of categories) {
        assert(categoryIds.has(cat.id), `Category "${cat.name}" (${cat.id}) has no services`)
      }
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  return steps
}

// Flow 4: Product Data Integrity ───────────────────────────────────────────

const productDataIntegrity: FlowFn = async (baseUrl) => {
  const steps: E2EStep[] = []
  let products: Record<string, unknown>[] = []

  // 1. Fetch products (>= 14)
  {
    const name = "Fetch products: count >= 14"
    try {
      const { data } = await fetchJson(`${baseUrl}/api/products/get-all-products`)
      assert(Array.isArray(data), "Not an array")
      products = data as typeof products
      assert(products.length >= 14, `Expected >= 14 products, got ${products.length}`)
      steps.push({ name, status: "pass", detail: `${products.length} products` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 2. Each product has name, price > 0, category
  {
    const name = "Each product has name, price > 0, category"
    try {
      for (const prod of products) {
        const prodName = prod.name as string
        assert(typeof prod.name === "string" && prod.name !== "", "Product missing name")
        assert(
          typeof prod.price === "number" && (prod.price as number) > 0,
          `Product "${prodName}" has invalid price: ${prod.price}`
        )
        assert(
          prod.category != null && prod.category !== "",
          `Product "${prodName}" missing category`
        )
      }
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 3. Aftercare products exist
  {
    const name = "Aftercare products exist"
    try {
      const aftercare = products.filter(
        (p) =>
          (p.category as string)?.toLowerCase().includes("aftercare") ||
          (p.name as string)?.toLowerCase().includes("aftercare")
      )
      assert(aftercare.length > 0, "No aftercare products found")
      steps.push({ name, status: "pass", detail: `${aftercare.length} aftercare products` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 4. Gift cards exist (category = "gift_card")
  {
    const name = "Gift card products exist (category = gift_card)"
    try {
      const giftCards = products.filter(
        (p) => (p.category as string)?.toLowerCase() === "gift_card"
      )
      assert(giftCards.length > 0, "No gift card products found")
      steps.push({ name, status: "pass", detail: `${giftCards.length} gift cards` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 5. No duplicate product names
  {
    const name = "No duplicate product names"
    try {
      const names = products.map((p) => (p.name as string).toLowerCase())
      const dupes = names.filter((n, i) => names.indexOf(n) !== i)
      assert(dupes.length === 0, `Duplicate names: ${Array.from(new Set(dupes)).join(", ")}`)
      steps.push({ name, status: "pass" })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  return steps
}

// Flow 5: Booking Flow (simulated) ─────────────────────────────────────────

const bookingFlow: FlowFn = async (baseUrl) => {
  const steps: E2EStep[] = []

  // 1. Fetch artists
  {
    const name = "Fetch artists: at least 1 exists"
    try {
      const { res, data } = await fetchJson(`${baseUrl}/api/artists`)
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      assert(Array.isArray(data) && (data as unknown[]).length >= 1, "Expected at least 1 artist")
      steps.push({ name, status: "pass", detail: `${(data as unknown[]).length} artists` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 2. Fetch services and pick first
  {
    const name = "Fetch services and pick first"
    try {
      const { res, data } = await fetchJson(`${baseUrl}/api/services`)
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      assert(Array.isArray(data) && (data as unknown[]).length > 0, "No services found")
      const first = (data as Record<string, unknown>[])[0]
      steps.push({ name, status: "pass", detail: `Picked: ${first.name}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 3. Check artist availability endpoint exists
  {
    const name = "GET /api/bookings/get-artist-bookings endpoint exists"
    try {
      const res = await timedFetch(`${baseUrl}/api/bookings/get-artist-bookings`)
      assert(res.status !== 404, "Endpoint returned 404 (not found)")
      assert(res.status < 500, `Server error ${res.status}`)
      steps.push({ name, status: "pass", detail: `status ${res.status}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 4. POST /api/bookings/create-booking with minimal body -> 400/401, not 500
  {
    const name = "POST /api/bookings/create-booking rejects gracefully (not 500)"
    try {
      const res = await timedFetch(`${baseUrl}/api/bookings/create-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      assert(
        res.status < 500,
        `Expected 4xx, got server error ${res.status}`
      )
      steps.push({ name, status: "pass", detail: `status ${res.status}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  return steps
}

// Flow 6: Order Flow (simulated) ───────────────────────────────────────────

const orderFlow: FlowFn = async (baseUrl) => {
  const steps: E2EStep[] = []

  // 1. Fetch products and pick first
  {
    const name = "Fetch products and pick first"
    try {
      const { res, data } = await fetchJson(`${baseUrl}/api/products/get-all-products`)
      assert(res.status === 200, `Expected 200, got ${res.status}`)
      assert(Array.isArray(data) && (data as unknown[]).length > 0, "No products found")
      const first = (data as Record<string, unknown>[])[0]
      steps.push({ name, status: "pass", detail: `Picked: ${first.name}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 2. POST /api/orders/create-order with minimal body -> 400/401, not 500
  {
    const name = "POST /api/orders/create-order rejects gracefully (not 500)"
    try {
      const res = await timedFetch(`${baseUrl}/api/orders/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      assert(res.status < 500, `Expected 4xx, got server error ${res.status}`)
      steps.push({ name, status: "pass", detail: `status ${res.status}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 3. POST /api/orders/fake-id/accept -> not 500
  {
    const name = "POST /api/orders/fake-id/accept rejects gracefully (not 500)"
    try {
      const res = await timedFetch(`${baseUrl}/api/orders/fake-id/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      assert(res.status < 500, `Expected non-500, got ${res.status}`)
      steps.push({ name, status: "pass", detail: `status ${res.status}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  // 4. POST /api/orders/fake-id/decline -> not 500
  {
    const name = "POST /api/orders/fake-id/decline rejects gracefully (not 500)"
    try {
      const res = await timedFetch(`${baseUrl}/api/orders/fake-id/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      assert(res.status < 500, `Expected non-500, got ${res.status}`)
      steps.push({ name, status: "pass", detail: `status ${res.status}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  return steps
}

// Flow 7: AI Endpoints (smoke test) ────────────────────────────────────────

const aiEndpoints: FlowFn = async (baseUrl) => {
  const steps: E2EStep[] = []

  const endpoints = [
    "/api/ai/generate-image-prompt",
    "/api/ai/generate-image",
    "/api/ai/generate-poster-suggestions",
    "/api/packages/suggest-ai",
  ]

  for (const endpoint of endpoints) {
    const name = `POST ${endpoint} returns non-500`
    try {
      const res = await timedFetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      assert(res.status < 500, `Server error ${res.status}`)
      steps.push({ name, status: "pass", detail: `status ${res.status}` })
    } catch (e: unknown) {
      steps.push({ name, status: "fail", detail: (e as Error).message })
    }
  }

  return steps
}

// ---------------------------------------------------------------------------
// Flow registry
// ---------------------------------------------------------------------------

const flows: { name: string; fn: FlowFn }[] = [
  { name: "Public Browsing", fn: publicBrowsing },
  { name: "Admin Login & Dashboard", fn: adminLoginDashboard },
  { name: "Service Data Integrity", fn: serviceDataIntegrity },
  { name: "Product Data Integrity", fn: productDataIntegrity },
  { name: "Booking Flow (simulated)", fn: bookingFlow },
  { name: "Order Flow (simulated)", fn: orderFlow },
  { name: "AI Endpoints (smoke test)", fn: aiEndpoints },
]

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function runE2ETests(
  baseUrl: string,
  options?: {
    verbose?: boolean
    adminPassword?: string
  }
): Promise<E2ETestResult[]> {
  const verbose = options?.verbose ?? false
  const adminPassword = options?.adminPassword ?? "admin"
  const normalizedUrl = baseUrl.replace(/\/+$/, "")

  const results: E2ETestResult[] = []

  console.log(
    `\n${colors.bold}${colors.cyan}===  Midnight Studio E2E Integration Tests  ===${colors.reset}`
  )
  console.log(`${colors.dim}Target: ${normalizedUrl}${colors.reset}\n`)

  for (const { name, fn } of flows) {
    console.log(`${colors.bold}--- ${name} ---${colors.reset}`)
    const start = Date.now()

    let steps: E2EStep[]
    try {
      steps = await fn(normalizedUrl, { verbose, adminPassword })
    } catch (e: unknown) {
      steps = [{ name: "Unexpected error", status: "fail", detail: (e as Error).message }]
    }

    const duration = Date.now() - start
    const allPassed = steps.every((s) => s.status === "pass")
    const status: "pass" | "fail" = allPassed ? "pass" : "fail"

    for (const step of steps) {
      const detail = verbose && step.detail ? ` ${colors.dim}(${step.detail})${colors.reset}` : ""
      console.log(`  ${icon(step.status)} ${step.name}${detail}`)
    }

    console.log(
      `  ${icon(status)} Flow result: ${status.toUpperCase()} ${colors.dim}(${duration}ms)${colors.reset}\n`
    )

    results.push({ flow: name, status, steps, duration })
  }

  // Summary
  const passed = results.filter((r) => r.status === "pass").length
  const failed = results.filter((r) => r.status === "fail").length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`${colors.bold}${colors.cyan}===  Summary  ===${colors.reset}`)
  console.log(
    `  ${colors.green}${passed} passed${colors.reset}, ${colors.red}${failed} failed${colors.reset} — ${totalDuration}ms total\n`
  )

  return results
}
