// =============================================================================
// Frontend Validation Agent — Midnight Studio Salon App
// Validates pages for correct rendering, content, performance, and structure.
// Uses native fetch + regex-based HTML inspection (zero external deps).
// =============================================================================

export interface ValidationResult {
  page: string;
  status: "pass" | "warn" | "fail";
  checks: CheckResult[];
  duration: number;
}

export interface CheckResult {
  name: string;
  status: "pass" | "warn" | "fail";
  message?: string;
}

// ---------------------------------------------------------------------------
// Page registry
// ---------------------------------------------------------------------------

interface PageSpec {
  path: string;
  /** Content substrings expected in a successful render (case-insensitive). */
  expectedContent?: string[];
  /** If true the page may redirect (302/303) when the user is not authenticated. */
  authGated?: boolean;
}

const PUBLIC_PAGES: PageSpec[] = [
  { path: "/", expectedContent: ["midnight", "studio"] },
  { path: "/services", expectedContent: ["tattoo"] },
  { path: "/products", expectedContent: ["product"] },
  { path: "/gift-cards", expectedContent: ["gift"] },
  { path: "/contact", expectedContent: ["contact"] },
  { path: "/terms", expectedContent: ["terms"] },
  { path: "/login", expectedContent: ["login", "sign"] },
  { path: "/artists", expectedContent: ["artist"] },
  { path: "/book", expectedContent: ["book"] },
];

const ADMIN_PAGES: PageSpec[] = [
  { path: "/dash-admin", authGated: true },
  { path: "/dash-admin/users", authGated: true },
  { path: "/dash-admin/services", authGated: true },
  { path: "/dash-admin/products", authGated: true },
  { path: "/dash-admin/orders", authGated: true },
  { path: "/dash-admin/packages", authGated: true },
  { path: "/dash-admin/bulk-sms", authGated: true },
];

const ARTIST_PAGES: PageSpec[] = [
  { path: "/artist", authGated: true },
  { path: "/artist/calendar", authGated: true },
  { path: "/artist/services", authGated: true },
  { path: "/artist/orders", authGated: true },
  { path: "/artist/messages", authGated: true },
];

const CUSTOMER_PAGES: PageSpec[] = [
  { path: "/customer/bookings", authGated: true },
  { path: "/customer/orders", authGated: true },
  { path: "/customer/profile", authGated: true },
  { path: "/customer/shop", authGated: true },
  { path: "/customer/cart", authGated: true },
];

const ALL_PAGES: PageSpec[] = [
  ...PUBLIC_PAGES,
  ...ADMIN_PAGES,
  ...ARTIST_PAGES,
  ...CUSTOMER_PAGES,
];

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const RESPONSE_WARN_MS = 3000;
const RESPONSE_FAIL_MS = 10000;

// ---------------------------------------------------------------------------
// Console helpers
// ---------------------------------------------------------------------------

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
};

function icon(status: "pass" | "warn" | "fail"): string {
  if (status === "pass") return `${C.green}[PASS]${C.reset}`;
  if (status === "warn") return `${C.yellow}[WARN]${C.reset}`;
  return `${C.red}[FAIL]${C.reset}`;
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

function checkHttpStatus(
  statusCode: number,
  authGated: boolean,
): CheckResult {
  if (statusCode === 200) {
    return { name: "HTTP status 200", status: "pass" };
  }
  if (authGated && [301, 302, 303, 307, 308].includes(statusCode)) {
    return {
      name: "HTTP status (auth redirect)",
      status: "pass",
      message: `Redirected with ${statusCode} (expected for auth-gated page)`,
    };
  }
  if (statusCode >= 500) {
    return {
      name: "HTTP status",
      status: "fail",
      message: `Server error: ${statusCode}`,
    };
  }
  return {
    name: "HTTP status",
    status: "warn",
    message: `Unexpected status: ${statusCode}`,
  };
}

function checkValidHtml(html: string): CheckResult[] {
  const results: CheckResult[] = [];

  const hasDoctype = /<!doctype\s+html/i.test(html);
  results.push(
    hasDoctype
      ? { name: "Has DOCTYPE", status: "pass" }
      : { name: "Has DOCTYPE", status: "fail", message: "Missing <!DOCTYPE html>" },
  );

  const hasHtmlTag = /<html[\s>]/i.test(html);
  results.push(
    hasHtmlTag
      ? { name: "Has <html> tag", status: "pass" }
      : { name: "Has <html> tag", status: "fail", message: "Missing <html> tag" },
  );

  const hasBody = /<body[\s>]/i.test(html);
  results.push(
    hasBody
      ? { name: "Has <body> tag", status: "pass" }
      : { name: "Has <body> tag", status: "fail", message: "Missing <body> tag" },
  );

  const hasHead = /<head[\s>]/i.test(html);
  results.push(
    hasHead
      ? { name: "Has <head> tag", status: "pass" }
      : { name: "Has <head> tag", status: "warn", message: "Missing <head> tag" },
  );

  return results;
}

function checkNoServerErrors(html: string): CheckResult {
  const errorPatterns = [
    /Internal Server Error/i,
    /Error:\s*\d{3}/,
    /at\s+\S+\s+\(.*:\d+:\d+\)/,  // stack trace
    /NEXT_NOT_FOUND/,
    /Application error: a (?:client|server)-side exception/i,
    /Unhandled Runtime Error/i,
    /TypeError:/,
    /ReferenceError:/,
    /Cannot read propert(?:y|ies) of (?:null|undefined)/,
  ];

  for (const pattern of errorPatterns) {
    const match = html.match(pattern);
    if (match) {
      return {
        name: "No server errors in HTML",
        status: "fail",
        message: `Found error indicator: "${match[0]}"`,
      };
    }
  }

  return { name: "No server errors in HTML", status: "pass" };
}

function checkExpectedContent(
  html: string,
  expected: string[] | undefined,
): CheckResult[] {
  if (!expected || expected.length === 0) return [];
  const lower = html.toLowerCase();
  return expected.map((term) => {
    const found = lower.includes(term.toLowerCase());
    return found
      ? { name: `Contains "${term}"`, status: "pass" as const }
      : {
          name: `Contains "${term}"`,
          status: "warn" as const,
          message: `Expected content "${term}" not found in page`,
        };
  });
}

function checkResponseTime(durationMs: number): CheckResult {
  if (durationMs > RESPONSE_FAIL_MS) {
    return {
      name: "Response time",
      status: "fail",
      message: `${durationMs}ms exceeds ${RESPONSE_FAIL_MS}ms threshold`,
    };
  }
  if (durationMs > RESPONSE_WARN_MS) {
    return {
      name: "Response time",
      status: "warn",
      message: `${durationMs}ms exceeds ${RESPONSE_WARN_MS}ms warning threshold`,
    };
  }
  return {
    name: "Response time",
    status: "pass",
    message: `${durationMs}ms`,
  };
}

function checkBrokenImages(html: string): CheckResult {
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const missing: string[] = [];
  for (const tag of imgTags) {
    const srcMatch = tag.match(/src\s*=\s*["']([^"']*)["']/i);
    if (!srcMatch || srcMatch[1].trim() === "") {
      missing.push(tag.slice(0, 80));
    }
  }
  if (missing.length > 0) {
    return {
      name: "Images have src",
      status: "warn",
      message: `${missing.length} image(s) with empty or missing src`,
    };
  }
  return { name: "Images have src", status: "pass" };
}

function checkBrokenLinks(html: string): CheckResult {
  const anchors = html.match(/<a[^>]*>/gi) || [];
  let emptyCount = 0;
  for (const tag of anchors) {
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']*)["']/i);
    if (!hrefMatch || hrefMatch[1].trim() === "" || hrefMatch[1] === "#") {
      emptyCount++;
    }
  }
  if (emptyCount > 0) {
    return {
      name: "Links have href",
      status: "warn",
      message: `${emptyCount} link(s) with empty or placeholder href`,
    };
  }
  return { name: "Links have href", status: "pass" };
}

function checkFormLabels(html: string): CheckResult {
  // Look for <input> elements that are not hidden and check for associated labels
  const inputs = html.match(/<input[^>]*>/gi) || [];
  let unlabeled = 0;

  for (const tag of inputs) {
    // Skip hidden, submit, button types
    if (/type\s*=\s*["'](?:hidden|submit|button|reset)["']/i.test(tag)) continue;

    const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(tag);
    const hasAriaLabelledBy = /aria-labelledby\s*=\s*["'][^"']+["']/i.test(tag);
    const hasTitle = /title\s*=\s*["'][^"']+["']/i.test(tag);
    const hasPlaceholder = /placeholder\s*=\s*["'][^"']+["']/i.test(tag);
    const idMatch = tag.match(/id\s*=\s*["']([^"']+)["']/i);

    // Check if there is a <label for="id"> in the document
    let hasLabelFor = false;
    if (idMatch) {
      const labelPattern = new RegExp(
        `<label[^>]*for\\s*=\\s*["']${escapeRegex(idMatch[1])}["']`,
        "i",
      );
      hasLabelFor = labelPattern.test(html);
    }

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasLabelFor && !hasPlaceholder) {
      unlabeled++;
    }
  }

  if (unlabeled > 0) {
    return {
      name: "Form inputs have labels",
      status: "warn",
      message: `${unlabeled} input(s) without an accessible label`,
    };
  }
  return { name: "Form inputs have labels", status: "pass" };
}

function checkResponsiveViewport(html: string): CheckResult {
  const hasViewport = /<meta[^>]*name\s*=\s*["']viewport["'][^>]*>/i.test(html);
  return hasViewport
    ? { name: "Viewport meta tag", status: "pass" }
    : {
        name: "Viewport meta tag",
        status: "warn",
        message: "Missing <meta name=\"viewport\"> for responsive design",
      };
}

function checkCssCustomProperties(html: string): CheckResult {
  // Check if any CSS custom properties (--var) are referenced in inline styles or <style> blocks
  const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  const inlineStyles = html.match(/style\s*=\s*["'][^"']*["']/gi) || [];
  const allCss = [...styleBlocks, ...inlineStyles].join(" ");

  const hasCustomProps = /var\(--[a-zA-Z0-9_-]+\)/.test(allCss) || /--[a-zA-Z0-9_-]+\s*:/.test(allCss);

  if (hasCustomProps) {
    return { name: "CSS custom properties used", status: "pass" };
  }
  // Not a failure — just informational
  return {
    name: "CSS custom properties used",
    status: "pass",
    message: "No inline CSS custom properties detected (may be in external stylesheets)",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function worstStatus(checks: CheckResult[]): "pass" | "warn" | "fail" {
  if (checks.some((c) => c.status === "fail")) return "fail";
  if (checks.some((c) => c.status === "warn")) return "warn";
  return "pass";
}

// ---------------------------------------------------------------------------
// Core validator
// ---------------------------------------------------------------------------

async function validatePage(
  baseUrl: string,
  spec: PageSpec,
  verbose: boolean,
): Promise<ValidationResult> {
  const url = `${baseUrl.replace(/\/+$/, "")}${spec.path}`;
  const checks: CheckResult[] = [];
  const t0 = Date.now();

  try {
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": "MidnightStudio-FrontendValidator/1.0",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(RESPONSE_FAIL_MS + 2000),
    });

    const duration = Date.now() - t0;

    // HTTP status
    checks.push(checkHttpStatus(response.status, !!spec.authGated));

    // Response time
    checks.push(checkResponseTime(duration));

    // If we got a redirect for an auth-gated page, we cannot inspect the body.
    const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
    if (isRedirect && spec.authGated) {
      const result: ValidationResult = {
        page: spec.path,
        status: worstStatus(checks),
        checks,
        duration,
      };
      logResult(result, verbose);
      return result;
    }

    const html = await response.text();

    // Structure checks
    checks.push(...checkValidHtml(html));
    checks.push(checkNoServerErrors(html));
    checks.push(checkResponsiveViewport(html));

    // Content checks
    checks.push(...checkExpectedContent(html, spec.expectedContent));

    // Asset / link checks
    checks.push(checkBrokenImages(html));
    checks.push(checkBrokenLinks(html));

    // Form accessibility
    checks.push(checkFormLabels(html));

    // CSS custom properties
    checks.push(checkCssCustomProperties(html));

    const result: ValidationResult = {
      page: spec.path,
      status: worstStatus(checks),
      checks,
      duration,
    };

    logResult(result, verbose);
    return result;
  } catch (err: unknown) {
    const duration = Date.now() - t0;
    const message = err instanceof Error ? err.message : String(err);
    checks.push({
      name: "Fetch page",
      status: "fail",
      message: `Failed to fetch ${url}: ${message}`,
    });

    const result: ValidationResult = {
      page: spec.path,
      status: "fail",
      checks,
      duration,
    };
    logResult(result, verbose);
    return result;
  }
}

function logResult(result: ValidationResult, verbose: boolean): void {
  const tag = icon(result.status);
  console.log(
    `${tag} ${C.bold}${result.page}${C.reset} ${C.dim}(${result.duration}ms)${C.reset}`,
  );
  if (verbose) {
    for (const check of result.checks) {
      const ci = icon(check.status);
      const msg = check.message ? ` — ${check.message}` : "";
      console.log(`    ${ci} ${check.name}${msg}`);
    }
  } else {
    // In non-verbose mode only print non-pass checks
    const issues = result.checks.filter((c) => c.status !== "pass");
    for (const check of issues) {
      const ci = icon(check.status);
      const msg = check.message ? ` — ${check.message}` : "";
      console.log(`    ${ci} ${check.name}${msg}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ValidateOptions {
  pages?: string[];
  verbose?: boolean;
}

export async function validateFrontend(
  baseUrl: string,
  options?: ValidateOptions,
): Promise<ValidationResult[]> {
  const verbose = options?.verbose ?? false;

  // Filter pages if a subset was requested
  let pages: PageSpec[];
  if (options?.pages && options.pages.length > 0) {
    const requested = new Set(options.pages.map((p) => p.replace(/\/+$/, "")));
    pages = ALL_PAGES.filter((s) => requested.has(s.path));
    // Include any requested paths not in the registry as generic checks
    for (const p of requested) {
      if (!pages.some((s) => s.path === p)) {
        pages.push({ path: p });
      }
    }
  } else {
    pages = ALL_PAGES;
  }

  console.log(
    `\n${C.cyan}${C.bold}Midnight Studio — Frontend Validator${C.reset}`,
  );
  console.log(`${C.dim}Base URL: ${baseUrl}${C.reset}`);
  console.log(`${C.dim}Pages: ${pages.length}${C.reset}\n`);

  // Validate pages sequentially to avoid overwhelming the server
  const results: ValidationResult[] = [];
  for (const spec of pages) {
    results.push(await validatePage(baseUrl, spec, verbose));
  }

  // Summary
  const passed = results.filter((r) => r.status === "pass").length;
  const warned = results.filter((r) => r.status === "warn").length;
  const failed = results.filter((r) => r.status === "fail").length;

  console.log(`\n${C.bold}Summary${C.reset}`);
  console.log(
    `  ${C.green}${passed} passed${C.reset}  ${C.yellow}${warned} warnings${C.reset}  ${C.red}${failed} failed${C.reset}  (${results.length} total)`,
  );
  console.log();

  return results;
}
