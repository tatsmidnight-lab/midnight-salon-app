// =============================================================================
// Accessibility Checker — Midnight Studio Salon App
// Lightweight a11y auditing via native fetch + regex HTML inspection.
// Zero external dependencies.
// =============================================================================

export interface A11yResult {
  page: string;
  issues: A11yIssue[];
  score: number; // 0-100
}

export interface A11yIssue {
  type: "error" | "warning";
  rule: string;
  message: string;
  selector?: string;
}

// ---------------------------------------------------------------------------
// Default pages (same groups as frontend-validator)
// ---------------------------------------------------------------------------

const DEFAULT_PAGES = [
  // Public
  "/",
  "/services",
  "/products",
  "/gift-cards",
  "/contact",
  "/terms",
  "/login",
  "/artists",
  "/book",
  // Admin
  "/dash-admin",
  "/dash-admin/users",
  "/dash-admin/services",
  "/dash-admin/products",
  "/dash-admin/orders",
  "/dash-admin/packages",
  "/dash-admin/bulk-sms",
  // Artist
  "/artist",
  "/artist/calendar",
  "/artist/services",
  "/artist/orders",
  "/artist/messages",
  // Customer
  "/customer/bookings",
  "/customer/orders",
  "/customer/profile",
  "/customer/shop",
  "/customer/cart",
];

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

function badge(score: number): string {
  if (score >= 90) return `${C.green}${score}${C.reset}`;
  if (score >= 70) return `${C.yellow}${score}${C.reset}`;
  return `${C.red}${score}${C.reset}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Extract a short selector-like descriptor from a raw tag string. */
function selectorOf(tag: string): string {
  const idMatch = tag.match(/id\s*=\s*["']([^"']+)["']/i);
  const classMatch = tag.match(/class\s*=\s*["']([^"']+)["']/i);
  const nameMatch = tag.match(/name\s*=\s*["']([^"']+)["']/i);
  const tagName = tag.match(/^<(\w+)/)?.[1] ?? "element";

  let sel = tagName;
  if (idMatch) sel += `#${idMatch[1]}`;
  else if (nameMatch) sel += `[name="${nameMatch[1]}"]`;
  else if (classMatch) sel += `.${classMatch[1].split(/\s+/)[0]}`;
  return sel;
}

// ---------------------------------------------------------------------------
// Rule implementations
// ---------------------------------------------------------------------------

function checkImagesAltText(html: string): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const imgs = html.match(/<img[^>]*>/gi) || [];

  for (const tag of imgs) {
    const hasAlt = /alt\s*=\s*["']/i.test(tag);
    if (!hasAlt) {
      issues.push({
        type: "error",
        rule: "img-alt",
        message: "Image is missing alt attribute",
        selector: selectorOf(tag),
      });
    } else {
      // Check for empty alt on non-decorative images
      const altVal = tag.match(/alt\s*=\s*["']([^"']*)["']/i);
      if (altVal && altVal[1].trim() === "" && !/role\s*=\s*["']presentation["']/i.test(tag)) {
        issues.push({
          type: "warning",
          rule: "img-alt-empty",
          message:
            'Image has empty alt text without role="presentation" — may need descriptive alt',
          selector: selectorOf(tag),
        });
      }
    }
  }
  return issues;
}

function checkFormInputLabels(html: string): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const inputs = html.match(/<input[^>]*>/gi) || [];

  for (const tag of inputs) {
    // Skip types that don't need visible labels
    if (/type\s*=\s*["'](?:hidden|submit|button|reset|image)["']/i.test(tag)) continue;

    const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(tag);
    const hasAriaLabelledBy = /aria-labelledby\s*=\s*["'][^"']+["']/i.test(tag);
    const hasTitle = /title\s*=\s*["'][^"']+["']/i.test(tag);
    const idMatch = tag.match(/id\s*=\s*["']([^"']+)["']/i);

    let hasLabelFor = false;
    if (idMatch) {
      const re = new RegExp(
        `<label[^>]*for\\s*=\\s*["']${escapeRegex(idMatch[1])}["']`,
        "i",
      );
      hasLabelFor = re.test(html);
    }

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasLabelFor) {
      issues.push({
        type: "error",
        rule: "input-label",
        message: "Form input has no associated label, aria-label, or title",
        selector: selectorOf(tag),
      });
    }
  }

  // Also check <select> and <textarea>
  const selects = html.match(/<(?:select|textarea)[^>]*>/gi) || [];
  for (const tag of selects) {
    const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(tag);
    const hasAriaLabelledBy = /aria-labelledby\s*=\s*["'][^"']+["']/i.test(tag);
    const hasTitle = /title\s*=\s*["'][^"']+["']/i.test(tag);
    const idMatch = tag.match(/id\s*=\s*["']([^"']+)["']/i);

    let hasLabelFor = false;
    if (idMatch) {
      const re = new RegExp(
        `<label[^>]*for\\s*=\\s*["']${escapeRegex(idMatch[1])}["']`,
        "i",
      );
      hasLabelFor = re.test(html);
    }

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasLabelFor) {
      issues.push({
        type: "error",
        rule: "input-label",
        message: `${tag.match(/^<(\w+)/)?.[1]} has no associated label`,
        selector: selectorOf(tag),
      });
    }
  }

  return issues;
}

function checkButtonAccessibleNames(html: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Match <button ...>...</button> — non-greedy across content
  const buttonPattern = /<button[^>]*>[\s\S]*?<\/button>/gi;
  const buttons = html.match(buttonPattern) || [];

  for (const full of buttons) {
    const openTag = full.match(/<button[^>]*>/i)?.[0] ?? "";
    const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(openTag);
    const hasAriaLabelledBy = /aria-labelledby\s*=\s*["'][^"']+["']/i.test(openTag);
    const hasTitle = /title\s*=\s*["'][^"']+["']/i.test(openTag);

    // Strip inner HTML tags and check for text content
    const innerText = full
      .replace(/<button[^>]*>/i, "")
      .replace(/<\/button>/i, "")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && innerText.length === 0) {
      issues.push({
        type: "error",
        rule: "button-name",
        message: "Button has no accessible name (no text, aria-label, or title)",
        selector: selectorOf(openTag),
      });
    }
  }

  return issues;
}

function checkHeadingHierarchy(html: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Find all heading tags in order
  const headingPattern = /<h([1-6])[^>]*>/gi;
  let match: RegExpExecArray | null;
  const levels: number[] = [];

  while ((match = headingPattern.exec(html)) !== null) {
    levels.push(parseInt(match[1], 10));
  }

  if (levels.length === 0) return issues;

  // First heading should ideally be h1
  if (levels[0] !== 1) {
    issues.push({
      type: "warning",
      rule: "heading-order",
      message: `First heading is <h${levels[0]}>, expected <h1>`,
    });
  }

  // Check for skipped levels
  for (let i = 1; i < levels.length; i++) {
    const prev = levels[i - 1];
    const curr = levels[i];
    // Going deeper should only increase by 1
    if (curr > prev && curr - prev > 1) {
      issues.push({
        type: "warning",
        rule: "heading-order",
        message: `Heading level skipped: <h${prev}> followed by <h${curr}>`,
      });
    }
  }

  return issues;
}

function checkColorContrast(html: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Very basic heuristic: look for inline styles with very light colors on presumably light backgrounds.
  // We catch obvious issues like color: #fff or color: white with no dark background set.
  const lightColorPattern =
    /style\s*=\s*["'][^"']*color\s*:\s*(?:#(?:fff|fefefe|fafafa|f[0-9a-f]{5})|white|rgb\s*\(\s*2[4-5]\d\s*,\s*2[4-5]\d\s*,\s*2[4-5]\d\s*\))[^"']*["']/gi;

  const matches = html.match(lightColorPattern) || [];
  for (const m of matches) {
    // Check if a dark background is also specified in the same style
    const hasDarkBg =
      /background(?:-color)?\s*:\s*(?:#(?:0|1|2|3)[0-9a-f]{5}|black|rgb\s*\(\s*[0-5]\d)/i.test(
        m,
      );
    if (!hasDarkBg) {
      issues.push({
        type: "warning",
        rule: "color-contrast",
        message:
          "Very light text color detected without a visibly dark background — may have contrast issues",
      });
    }
  }

  return issues;
}

function checkFocusIndicators(html: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Check <style> blocks for outline: none or outline: 0 without a replacement focus style
  const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  const allStyles = styleBlocks.join(" ");

  if (/outline\s*:\s*(?:none|0)\b/i.test(allStyles)) {
    // Check if there is also a custom :focus or :focus-visible style
    const hasFocusStyle = /:focus(?:-visible)?\s*\{[^}]*(?:box-shadow|border|outline)/i.test(
      allStyles,
    );
    if (!hasFocusStyle) {
      issues.push({
        type: "warning",
        rule: "focus-indicator",
        message:
          'CSS includes "outline: none" without a visible :focus replacement — keyboard users may lose focus visibility',
      });
    }
  }

  return issues;
}

function checkHtmlLang(html: string): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const htmlTag = html.match(/<html[^>]*>/i);
  if (htmlTag) {
    const hasLang = /lang\s*=\s*["'][^"']+["']/i.test(htmlTag[0]);
    if (!hasLang) {
      issues.push({
        type: "error",
        rule: "html-lang",
        message: '<html> element is missing a lang attribute (e.g., lang="en")',
        selector: "html",
      });
    }
  }
  return issues;
}

function checkEmptyLinks(html: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  const linkPattern = /<a[^>]*>[\s\S]*?<\/a>/gi;
  const links = html.match(linkPattern) || [];

  for (const full of links) {
    const openTag = full.match(/<a[^>]*>/i)?.[0] ?? "";
    const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(openTag);
    const hasAriaLabelledBy = /aria-labelledby\s*=\s*["'][^"']+["']/i.test(openTag);
    const hasTitle = /title\s*=\s*["'][^"']+["']/i.test(openTag);

    // Strip tags and check for text
    const innerText = full
      .replace(/<a[^>]*>/i, "")
      .replace(/<\/a>/i, "")
      .replace(/<[^>]*>/g, "")
      .trim();

    // Check if it contains an image with alt text (image link)
    const hasImgAlt = /<img[^>]*alt\s*=\s*["'][^"']+["'][^>]*>/i.test(full);

    if (
      !hasAriaLabel &&
      !hasAriaLabelledBy &&
      !hasTitle &&
      !hasImgAlt &&
      innerText.length === 0
    ) {
      issues.push({
        type: "error",
        rule: "empty-link",
        message: "Link has no accessible text content",
        selector: selectorOf(openTag),
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function calculateScore(issues: A11yIssue[]): number {
  if (issues.length === 0) return 100;

  const errors = issues.filter((i) => i.type === "error").length;
  const warnings = issues.filter((i) => i.type === "warning").length;

  // Each error costs 10 points, each warning costs 3, floored at 0
  const deduction = errors * 10 + warnings * 3;
  return Math.max(0, 100 - deduction);
}

// ---------------------------------------------------------------------------
// Core checker
// ---------------------------------------------------------------------------

async function checkPage(baseUrl: string, path: string): Promise<A11yResult> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;

  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "MidnightStudio-A11yChecker/1.0",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });

    // If we got a redirect (auth gated) with manual redirect we might get no body.
    // With redirect: "follow" we should get the login page HTML.
    if (!response.ok && response.status !== 200) {
      return {
        page: path,
        issues: [
          {
            type: "warning",
            rule: "page-load",
            message: `Page returned HTTP ${response.status}`,
          },
        ],
        score: 80,
      };
    }

    const html = await response.text();
    const issues: A11yIssue[] = [
      ...checkHtmlLang(html),
      ...checkImagesAltText(html),
      ...checkFormInputLabels(html),
      ...checkButtonAccessibleNames(html),
      ...checkHeadingHierarchy(html),
      ...checkColorContrast(html),
      ...checkFocusIndicators(html),
      ...checkEmptyLinks(html),
    ];

    const score = calculateScore(issues);

    return { page: path, issues, score };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      page: path,
      issues: [
        {
          type: "error",
          rule: "page-load",
          message: `Failed to fetch page: ${message}`,
        },
      ],
      score: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkAccessibility(
  baseUrl: string,
  pages?: string[],
): Promise<A11yResult[]> {
  const targets = pages && pages.length > 0 ? pages : DEFAULT_PAGES;

  console.log(
    `\n${C.cyan}${C.bold}Midnight Studio — Accessibility Checker${C.reset}`,
  );
  console.log(`${C.dim}Base URL: ${baseUrl}${C.reset}`);
  console.log(`${C.dim}Pages: ${targets.length}${C.reset}\n`);

  const results: A11yResult[] = [];

  for (const path of targets) {
    const result = await checkPage(baseUrl, path);
    results.push(result);

    // Log
    const errCount = result.issues.filter((i) => i.type === "error").length;
    const warnCount = result.issues.filter((i) => i.type === "warning").length;
    const scoreStr = badge(result.score);

    console.log(
      `${scoreStr}/100 ${C.bold}${result.page}${C.reset}  ${C.red}${errCount} errors${C.reset}  ${C.yellow}${warnCount} warnings${C.reset}`,
    );

    if (result.issues.length > 0) {
      for (const issue of result.issues) {
        const prefix =
          issue.type === "error"
            ? `${C.red}  ERR${C.reset}`
            : `${C.yellow}  WRN${C.reset}`;
        const sel = issue.selector ? ` ${C.dim}(${issue.selector})${C.reset}` : "";
        console.log(`${prefix} [${issue.rule}] ${issue.message}${sel}`);
      }
    }
  }

  // Summary
  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length,
  );
  const totalErrors = results.reduce(
    (sum, r) => sum + r.issues.filter((i) => i.type === "error").length,
    0,
  );
  const totalWarnings = results.reduce(
    (sum, r) => sum + r.issues.filter((i) => i.type === "warning").length,
    0,
  );

  console.log(`\n${C.bold}Summary${C.reset}`);
  console.log(`  Average score: ${badge(avgScore)}/100`);
  console.log(
    `  ${C.red}${totalErrors} errors${C.reset}  ${C.yellow}${totalWarnings} warnings${C.reset}  across ${results.length} pages`,
  );
  console.log();

  return results;
}
