// Backend Validation Agent for Midnight Studio Salon App
// Comprehensive API endpoint testing and data validation module

export interface ApiCheck {
  name: string
  status: "pass" | "warn" | "fail"
  message?: string
}

export interface ApiTestResult {
  endpoint: string
  method: string
  status: "pass" | "warn" | "fail"
  httpStatus: number
  responseTime: number
  checks: ApiCheck[]
}

interface ValidateOptions {
  verbose?: boolean
  adminPassword?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 10_000
const WARN_RESPONSE_MS = 2_000
const FAIL_RESPONSE_MS = 10_000

const VALID_SERVICE_CATEGORIES = [
  "Tattoo",
  "Piercing",
  "Eyelash",
  "Micropigmentation",
  "Course",
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function overall(checks: ApiCheck[]): "pass" | "warn" | "fail" {
  if (checks.some((c) => c.status === "fail")) return "fail"
  if (checks.some((c) => c.status === "warn")) return "warn"
  return "pass"
}

async function timedFetch(
  url: string,
  init?: RequestInit
): Promise<{ res: Response; elapsed: number }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const start = performance.now()
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    const elapsed = performance.now() - start
    return { res, elapsed }
  } finally {
    clearTimeout(timer)
  }
}

function responseTimeChecks(elapsed: number): ApiCheck[] {
  const checks: ApiCheck[] = []
  if (elapsed >= FAIL_RESPONSE_MS) {
    checks.push({
      name: "Response time",
      status: "fail",
      message: `${Math.round(elapsed)}ms (threshold ${FAIL_RESPONSE_MS}ms)`,
    })
  } else if (elapsed >= WARN_RESPONSE_MS) {
    checks.push({
      name: "Response time",
      status: "warn",
      message: `${Math.round(elapsed)}ms (warn threshold ${WARN_RESPONSE_MS}ms)`,
    })
  } else {
    checks.push({
      name: "Response time",
      status: "pass",
      message: `${Math.round(elapsed)}ms`,
    })
  }
  return checks
}

function statusCheck(
  actual: number,
  expected: number | number[],
  label = "HTTP status"
): ApiCheck {
  const ok = Array.isArray(expected)
    ? expected.includes(actual)
    : actual === expected
  return {
    name: label,
    status: ok ? "pass" : "fail",
    message: ok
      ? `${actual}`
      : `Expected ${Array.isArray(expected) ? expected.join("|") : expected}, got ${actual}`,
  }
}

function no500Check(actual: number): ApiCheck {
  return {
    name: "No server error",
    status: actual >= 500 ? "fail" : "pass",
    message: `${actual}`,
  }
}

function isJsonArrayCheck(body: unknown): ApiCheck {
  return {
    name: "Response is JSON array",
    status: Array.isArray(body) ? "pass" : "fail",
    message: Array.isArray(body)
      ? `${body.length} items`
      : `Got ${typeof body}`,
  }
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Individual test groups
// ---------------------------------------------------------------------------

async function testDataApi(
  baseUrl: string,
  path: string
): Promise<ApiTestResult> {
  const url = `${baseUrl}${path}`
  const checks: ApiCheck[] = []
  let httpStatus = 0
  let elapsed = 0

  try {
    const { res, elapsed: t } = await timedFetch(url)
    elapsed = t
    httpStatus = res.status
    checks.push(statusCheck(httpStatus, 200))
    checks.push(...responseTimeChecks(elapsed))

    const body = await parseJson(res)
    if (body === undefined) {
      checks.push({ name: "Valid JSON", status: "fail", message: "Failed to parse response as JSON" })
    } else {
      checks.push({ name: "Valid JSON", status: "pass" })
      checks.push(isJsonArrayCheck(body))
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    checks.push({ name: "Request", status: "fail", message: msg })
  }

  return { endpoint: path, method: "GET", status: overall(checks), httpStatus, responseTime: Math.round(elapsed), checks }
}

async function testAdminLogin(
  baseUrl: string,
  password: string
): Promise<ApiTestResult> {
  const path = "/api/auth/admin-login"
  const checks: ApiCheck[] = []
  let httpStatus = 0
  let elapsed = 0

  try {
    const { res, elapsed: t } = await timedFetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password }),
    })
    elapsed = t
    httpStatus = res.status
    checks.push(statusCheck(httpStatus, 200))
    checks.push(...responseTimeChecks(elapsed))

    const body = await parseJson(res)
    if (body === undefined) {
      checks.push({ name: "Valid JSON", status: "fail", message: "Failed to parse" })
    } else {
      checks.push({ name: "Valid JSON", status: "pass" })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    checks.push({ name: "Request", status: "fail", message: msg })
  }

  return { endpoint: path, method: "POST", status: overall(checks), httpStatus, responseTime: Math.round(elapsed), checks }
}

async function testAdminStats(baseUrl: string): Promise<ApiTestResult> {
  const path = "/api/admin/stats"
  const checks: ApiCheck[] = []
  let httpStatus = 0
  let elapsed = 0

  try {
    const { res, elapsed: t } = await timedFetch(`${baseUrl}${path}`)
    elapsed = t
    httpStatus = res.status
    // 401 is acceptable without a cookie — just no 500
    checks.push(no500Check(httpStatus))
    checks.push(...responseTimeChecks(elapsed))

    if (httpStatus === 200) {
      const body = await parseJson(res)
      if (body !== undefined) {
        checks.push({ name: "Valid JSON", status: "pass" })
      }
    } else {
      checks.push({
        name: "Auth required",
        status: httpStatus === 401 || httpStatus === 403 ? "pass" : "warn",
        message: `Status ${httpStatus} (expected 401/403 without auth)`,
      })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    checks.push({ name: "Request", status: "fail", message: msg })
  }

  return { endpoint: path, method: "GET", status: overall(checks), httpStatus, responseTime: Math.round(elapsed), checks }
}

async function testAiEndpoint(
  baseUrl: string,
  path: string
): Promise<ApiTestResult> {
  const checks: ApiCheck[] = []
  let httpStatus = 0
  let elapsed = 0

  try {
    const { res, elapsed: t } = await timedFetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    elapsed = t
    httpStatus = res.status

    // We expect 400 (bad request) NOT 500 (server error)
    checks.push(no500Check(httpStatus))
    checks.push({
      name: "Endpoint exists",
      status: httpStatus === 404 ? "fail" : "pass",
      message: `Status ${httpStatus}`,
    })
    checks.push({
      name: "Graceful rejection",
      status: httpStatus === 400 || httpStatus === 422 ? "pass" : "warn",
      message: `Expected 400/422, got ${httpStatus}`,
    })
    checks.push(...responseTimeChecks(elapsed))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    checks.push({ name: "Request", status: "fail", message: msg })
  }

  return { endpoint: path, method: "POST", status: overall(checks), httpStatus, responseTime: Math.round(elapsed), checks }
}

async function testOrderEndpoint(
  baseUrl: string,
  path: string,
  body?: Record<string, unknown>
): Promise<ApiTestResult> {
  const checks: ApiCheck[] = []
  let httpStatus = 0
  let elapsed = 0

  try {
    const { res, elapsed: t } = await timedFetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    })
    elapsed = t
    httpStatus = res.status

    checks.push(no500Check(httpStatus))
    checks.push({
      name: "Endpoint exists",
      status: httpStatus === 404 ? "fail" : "pass",
      message: `Status ${httpStatus}`,
    })
    checks.push(...responseTimeChecks(elapsed))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    checks.push({ name: "Request", status: "fail", message: msg })
  }

  return { endpoint: path, method: "POST", status: overall(checks), httpStatus, responseTime: Math.round(elapsed), checks }
}

// ---------------------------------------------------------------------------
// Data validation tests
// ---------------------------------------------------------------------------

async function validateServiceData(baseUrl: string): Promise<ApiTestResult> {
  const path = "/api/services"
  const checks: ApiCheck[] = []
  let httpStatus = 0
  let elapsed = 0

  try {
    const { res, elapsed: t } = await timedFetch(`${baseUrl}${path}`)
    elapsed = t
    httpStatus = res.status

    const body = await parseJson(res)
    if (!Array.isArray(body)) {
      checks.push({ name: "Fetch services", status: "fail", message: "Not an array" })
      return { endpoint: `${path} [data]`, method: "GET", status: "fail", httpStatus, responseTime: Math.round(elapsed), checks }
    }

    checks.push({ name: "Fetch services", status: "pass", message: `${body.length} services` })

    // Categories check
    const categories = [...new Set(body.map((s: Record<string, unknown>) => s.category))]
    const unknownCats = categories.filter(
      (c) => typeof c === "string" && !VALID_SERVICE_CATEGORIES.includes(c)
    )
    if (unknownCats.length > 0) {
      checks.push({
        name: "Valid categories",
        status: "warn",
        message: `Unknown categories: ${unknownCats.join(", ")}`,
      })
    } else {
      checks.push({ name: "Valid categories", status: "pass", message: categories.join(", ") })
    }

    // Prices > 0
    const zeroPriced = body.filter(
      (s: Record<string, unknown>) =>
        typeof s.price !== "number" || s.price <= 0
    )
    if (zeroPriced.length > 0) {
      const names = zeroPriced
        .slice(0, 5)
        .map((s: Record<string, unknown>) => s.name || "unnamed")
      checks.push({
        name: "All prices > 0",
        status: "fail",
        message: `${zeroPriced.length} services with invalid price: ${names.join(", ")}`,
      })
    } else {
      checks.push({ name: "All prices > 0", status: "pass" })
    }

    // Duplicate names
    const names = body.map((s: Record<string, unknown>) =>
      typeof s.name === "string" ? s.name.toLowerCase() : ""
    )
    const dupes = names.filter((n: string, i: number) => names.indexOf(n) !== i)
    if (dupes.length > 0) {
      checks.push({
        name: "No duplicate service names",
        status: "fail",
        message: `Duplicates: ${[...new Set(dupes)].join(", ")}`,
      })
    } else {
      checks.push({ name: "No duplicate service names", status: "pass" })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    checks.push({ name: "Service data validation", status: "fail", message: msg })
  }

  return { endpoint: `${path} [data validation]`, method: "GET", status: overall(checks), httpStatus, responseTime: Math.round(elapsed), checks }
}

async function validateProductData(baseUrl: string): Promise<ApiTestResult> {
  const path = "/api/products/get-all-products"
  const checks: ApiCheck[] = []
  let httpStatus = 0
  let elapsed = 0

  try {
    const { res, elapsed: t } = await timedFetch(`${baseUrl}${path}`)
    elapsed = t
    httpStatus = res.status

    const body = await parseJson(res)
    if (!Array.isArray(body)) {
      checks.push({ name: "Fetch products", status: "fail", message: "Not an array" })
      return { endpoint: `${path} [data]`, method: "GET", status: "fail", httpStatus, responseTime: Math.round(elapsed), checks }
    }

    checks.push({ name: "Fetch products", status: "pass", message: `${body.length} products` })

    // Aftercare items
    const aftercareItems = body.filter((p: Record<string, unknown>) => {
      const name = typeof p.name === "string" ? p.name.toLowerCase() : ""
      const category = typeof p.category === "string" ? p.category.toLowerCase() : ""
      return name.includes("aftercare") || category.includes("aftercare")
    })
    if (aftercareItems.length > 0) {
      checks.push({
        name: "Aftercare items exist",
        status: "pass",
        message: `${aftercareItems.length} aftercare item(s)`,
      })
    } else {
      checks.push({
        name: "Aftercare items exist",
        status: "warn",
        message: "No products with 'aftercare' in name or category",
      })
    }

    // Gift cards
    const giftCards = body.filter((p: Record<string, unknown>) => {
      const name = typeof p.name === "string" ? p.name.toLowerCase() : ""
      const category = typeof p.category === "string" ? p.category.toLowerCase() : ""
      return name.includes("gift") || category.includes("gift")
    })
    if (giftCards.length > 0) {
      checks.push({
        name: "Gift cards exist",
        status: "pass",
        message: `${giftCards.length} gift card(s)`,
      })
    } else {
      checks.push({
        name: "Gift cards exist",
        status: "warn",
        message: "No products with 'gift' in name or category",
      })
    }

    // Duplicate product names
    const names = body.map((p: Record<string, unknown>) =>
      typeof p.name === "string" ? p.name.toLowerCase() : ""
    )
    const dupes = names.filter((n: string, i: number) => names.indexOf(n) !== i)
    if (dupes.length > 0) {
      checks.push({
        name: "No duplicate product names",
        status: "fail",
        message: `Duplicates: ${[...new Set(dupes)].join(", ")}`,
      })
    } else {
      checks.push({ name: "No duplicate product names", status: "pass" })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    checks.push({ name: "Product data validation", status: "fail", message: msg })
  }

  return { endpoint: `${path} [data validation]`, method: "GET", status: overall(checks), httpStatus, responseTime: Math.round(elapsed), checks }
}

// ---------------------------------------------------------------------------
// Console reporter
// ---------------------------------------------------------------------------

const ICON = { pass: "\u2713", warn: "\u25B3", fail: "\u2717" } as const
const COLOR = {
  pass: "\x1b[32m",
  warn: "\x1b[33m",
  fail: "\x1b[31m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
} as const

function printReport(results: ApiTestResult[], verbose: boolean): void {
  const total = results.length
  const passed = results.filter((r) => r.status === "pass").length
  const warned = results.filter((r) => r.status === "warn").length
  const failed = results.filter((r) => r.status === "fail").length

  console.log()
  console.log(
    `${COLOR.bold}Midnight Studio — Backend Validation Report${COLOR.reset}`
  )
  console.log("=".repeat(55))
  console.log()

  for (const result of results) {
    const icon = ICON[result.status]
    const color = COLOR[result.status]
    const timing = `${COLOR.dim}${result.responseTime}ms${COLOR.reset}`

    console.log(
      `${color}${icon}${COLOR.reset} ${COLOR.bold}${result.method}${COLOR.reset} ${result.endpoint} ${timing}`
    )

    if (verbose || result.status !== "pass") {
      for (const check of result.checks) {
        const ci = ICON[check.status]
        const cc = COLOR[check.status]
        const msg = check.message ? ` — ${check.message}` : ""
        console.log(`  ${cc}${ci}${COLOR.reset} ${check.name}${COLOR.dim}${msg}${COLOR.reset}`)
      }
    }
  }

  console.log()
  console.log("-".repeat(55))
  console.log(
    `Total: ${total}  |  ` +
      `${COLOR.pass}${passed} passed${COLOR.reset}  |  ` +
      `${COLOR.warn}${warned} warned${COLOR.reset}  |  ` +
      `${COLOR.fail}${failed} failed${COLOR.reset}`
  )
  console.log()
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function validateBackend(
  baseUrl: string,
  options?: ValidateOptions
): Promise<ApiTestResult[]> {
  const verbose = options?.verbose ?? false
  const adminPassword = options?.adminPassword ?? "midnight2024"

  // Normalise base URL (strip trailing slash)
  const base = baseUrl.replace(/\/+$/, "")

  console.log(`${COLOR.dim}Validating backend at ${base}...${COLOR.reset}`)

  // ---- Data APIs (GET, expect 200 + JSON array) ----
  const dataEndpoints = [
    "/api/services",
    "/api/services/get-categories",
    "/api/products/get-all-products",
    "/api/artists",
    "/api/services/get-packages",
  ]

  const dataResults = await Promise.all(
    dataEndpoints.map((ep) => testDataApi(base, ep))
  )

  // ---- Auth APIs ----
  const [loginResult, statsResult] = await Promise.all([
    testAdminLogin(base, adminPassword),
    testAdminStats(base),
  ])

  // ---- AI APIs (POST with empty body, expect 400 not 500) ----
  const aiEndpoints = [
    "/api/ai/generate-image-prompt",
    "/api/ai/generate-image",
    "/api/ai/generate-poster-suggestions",
    "/api/packages/suggest-ai",
  ]

  const aiResults = await Promise.all(
    aiEndpoints.map((ep) => testAiEndpoint(base, ep))
  )

  // ---- Order APIs (POST with fake data, expect non-500) ----
  const orderResults = await Promise.all([
    testOrderEndpoint(base, "/api/orders/fake-id/accept"),
    testOrderEndpoint(base, "/api/orders/fake-id/decline", { reason: "test" }),
    testOrderEndpoint(base, "/api/packages/create", {}),
  ])

  // ---- Data validation ----
  const [serviceValidation, productValidation] = await Promise.all([
    validateServiceData(base),
    validateProductData(base),
  ])

  // ---- Assemble results ----
  const results: ApiTestResult[] = [
    ...dataResults,
    loginResult,
    statsResult,
    ...aiResults,
    ...orderResults,
    serviceValidation,
    productValidation,
  ]

  printReport(results, verbose)

  return results
}
