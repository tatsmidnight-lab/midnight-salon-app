#!/usr/bin/env node

/**
 * Midnight Studio Validation CLI
 *
 * Usage:
 *   node cli/midnight-validate.mjs <command> [options]
 *
 * Commands:
 *   frontend   Run frontend page validation
 *   backend    Run backend API validation
 *   e2e        Run end-to-end integration tests
 *   full       Run all validations
 *   report     Generate HTML report from last run
 *
 * Options:
 *   --base-url <url>   Base URL (default: http://localhost:3000)
 *   --verbose          Show detailed output
 *   --json             Output results as JSON
 *   --out <file>       Save results to file
 */

import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

// ─── Parse CLI args ─────────────────────────────────────

const args = process.argv.slice(2)
const command = args[0]

function getFlag(name) {
  return args.includes(`--${name}`)
}

function getOption(name, defaultVal) {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1 || idx + 1 >= args.length) return defaultVal
  return args[idx + 1]
}

const baseUrl = getOption("base-url", "http://localhost:3000")
const verbose = getFlag("verbose")
const jsonOutput = getFlag("json")
const outFile = getOption("out", null)

// ─── Colors ─────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
}

function statusIcon(s) {
  if (s === "pass") return `${c.green}✓${c.reset}`
  if (s === "warn") return `${c.yellow}⚠${c.reset}`
  return `${c.red}✗${c.reset}`
}

// ─── Load config ────────────────────────────────────────

let config = {}
const configPath = resolve(ROOT, ".midnight-validate.json")
if (existsSync(configPath)) {
  try {
    config = JSON.parse(readFileSync(configPath, "utf-8"))
  } catch {
    // ignore
  }
}

// ─── Dynamic imports (TypeScript agents compiled at runtime) ─

async function loadAgent(name) {
  // Try to import directly — works if tsx/ts-node is available
  // Otherwise fall back to a fetch-based approach
  const tsPath = resolve(ROOT, "lib", "agents", `${name}.ts`)
  const mjsPath = resolve(ROOT, "lib", "agents", `${name}.mjs`)

  // Try .mjs first (pre-compiled)
  if (existsSync(mjsPath)) {
    return import(mjsPath)
  }

  // Try .ts with tsx loader
  try {
    return await import(tsPath)
  } catch {
    // Can't load TS directly — inform user
    console.log(`${c.yellow}Note:${c.reset} Cannot import ${name}.ts directly.`)
    console.log(`  Run with: npx tsx cli/midnight-validate.mjs ${command}`)
    console.log(`  Or compile agents first: npx tsc lib/agents/${name}.ts --outDir lib/agents/`)
    process.exit(1)
  }
}

// ─── Commands ───────────────────────────────────────────

async function runFrontend() {
  console.log(`\n${c.bold}${c.cyan}FRONTEND VALIDATION${c.reset}`)
  console.log(`${c.dim}Base URL: ${baseUrl}${c.reset}\n`)

  const mod = await loadAgent("frontend-validator")
  const results = await mod.validateFrontend(baseUrl, { verbose })

  let pass = 0, warn = 0, fail = 0
  for (const r of results) {
    const icon = statusIcon(r.status)
    console.log(`  ${icon} ${r.page} ${c.dim}(${r.duration}ms)${c.reset}`)
    if (verbose || r.status === "fail") {
      for (const check of r.checks) {
        if (check.status !== "pass" || verbose) {
          console.log(`    ${statusIcon(check.status)} ${check.name}${check.message ? ` — ${check.message}` : ""}`)
        }
      }
    }
    if (r.status === "pass") pass++
    else if (r.status === "warn") warn++
    else fail++
  }

  console.log(`\n${c.bold}Frontend:${c.reset} ${c.green}${pass} pass${c.reset} ${warn > 0 ? `${c.yellow}${warn} warn${c.reset} ` : ""}${fail > 0 ? `${c.red}${fail} fail${c.reset}` : ""}\n`)
  return { type: "frontend", results, summary: { pass, warn, fail } }
}

async function runBackend() {
  console.log(`\n${c.bold}${c.cyan}BACKEND VALIDATION${c.reset}`)
  console.log(`${c.dim}Base URL: ${baseUrl}${c.reset}\n`)

  const mod = await loadAgent("backend-validator")
  const results = await mod.validateBackend(baseUrl, { verbose })

  let pass = 0, warn = 0, fail = 0
  for (const r of results) {
    const icon = statusIcon(r.status)
    console.log(`  ${icon} ${r.method} ${r.endpoint} ${c.dim}[${r.httpStatus}] (${r.responseTime}ms)${c.reset}`)
    if (verbose || r.status === "fail") {
      for (const check of r.checks) {
        if (check.status !== "pass" || verbose) {
          console.log(`    ${statusIcon(check.status)} ${check.name}${check.message ? ` — ${check.message}` : ""}`)
        }
      }
    }
    if (r.status === "pass") pass++
    else if (r.status === "warn") warn++
    else fail++
  }

  console.log(`\n${c.bold}Backend:${c.reset} ${c.green}${pass} pass${c.reset} ${warn > 0 ? `${c.yellow}${warn} warn${c.reset} ` : ""}${fail > 0 ? `${c.red}${fail} fail${c.reset}` : ""}\n`)
  return { type: "backend", results, summary: { pass, warn, fail } }
}

async function runE2E() {
  console.log(`\n${c.bold}${c.cyan}E2E INTEGRATION TESTS${c.reset}`)
  console.log(`${c.dim}Base URL: ${baseUrl}${c.reset}\n`)

  const mod = await loadAgent("e2e-integration-tester")
  const results = await mod.runE2ETests(baseUrl, { verbose })

  let pass = 0, fail = 0
  for (const r of results) {
    const icon = statusIcon(r.status)
    console.log(`  ${icon} ${r.flow} ${c.dim}(${r.duration}ms)${c.reset}`)
    if (verbose || r.status === "fail") {
      for (const step of r.steps) {
        if (step.status !== "pass" || verbose) {
          console.log(`    ${statusIcon(step.status)} ${step.name}${step.detail ? ` — ${step.detail}` : ""}`)
        }
      }
    }
    if (r.status === "pass") pass++
    else fail++
  }

  console.log(`\n${c.bold}E2E:${c.reset} ${c.green}${pass} pass${c.reset} ${fail > 0 ? `${c.red}${fail} fail${c.reset}` : ""}\n`)
  return { type: "e2e", results, summary: { pass, fail } }
}

async function runFull() {
  console.log(`${c.bold}${c.magenta}`)
  console.log(`  ╔══════════════════════════════════════╗`)
  console.log(`  ║   MIDNIGHT STUDIO — FULL VALIDATION  ║`)
  console.log(`  ╚══════════════════════════════════════╝`)
  console.log(`${c.reset}`)

  const startTime = Date.now()
  const allResults = []

  try {
    allResults.push(await runFrontend())
  } catch (err) {
    console.log(`${c.red}Frontend validation failed: ${err.message}${c.reset}`)
  }

  try {
    allResults.push(await runBackend())
  } catch (err) {
    console.log(`${c.red}Backend validation failed: ${err.message}${c.reset}`)
  }

  try {
    allResults.push(await runE2E())
  } catch (err) {
    console.log(`${c.red}E2E validation failed: ${err.message}${c.reset}`)
  }

  const totalDuration = Date.now() - startTime

  // Summary
  console.log(`${c.bold}${"═".repeat(50)}${c.reset}`)
  console.log(`${c.bold}TOTAL RESULTS${c.reset} ${c.dim}(${(totalDuration / 1000).toFixed(1)}s)${c.reset}\n`)

  let totalPass = 0, totalWarn = 0, totalFail = 0
  for (const r of allResults) {
    totalPass += r.summary.pass || 0
    totalWarn += r.summary.warn || 0
    totalFail += r.summary.fail || 0
    console.log(`  ${r.type.padEnd(12)} ${c.green}${r.summary.pass} pass${c.reset}  ${r.summary.warn ? `${c.yellow}${r.summary.warn} warn${c.reset}  ` : ""}${r.summary.fail ? `${c.red}${r.summary.fail} fail${c.reset}` : ""}`)
  }
  console.log(`\n  ${"─".repeat(40)}`)
  console.log(`  ${"TOTAL".padEnd(12)} ${c.green}${totalPass} pass${c.reset}  ${totalWarn ? `${c.yellow}${totalWarn} warn${c.reset}  ` : ""}${totalFail ? `${c.red}${totalFail} fail${c.reset}` : ""}`)
  console.log(`${c.bold}${"═".repeat(50)}${c.reset}\n`)

  return allResults
}

function generateReport(results) {
  const timestamp = new Date().toISOString()
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Midnight Studio — Validation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 2rem; }
    h1 { color: #c084fc; margin-bottom: 0.5rem; }
    .timestamp { color: #666; margin-bottom: 2rem; }
    .section { background: #1a1a2e; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .section h2 { color: #38bdf8; margin-bottom: 1rem; }
    .result { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid #222; }
    .pass { color: #4ade80; }
    .warn { color: #fbbf24; }
    .fail { color: #f87171; }
    .time { color: #666; font-size: 0.85rem; }
    .summary { background: #16213e; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
    .summary span { margin-right: 1.5rem; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Midnight Studio — Validation Report</h1>
  <p class="timestamp">Generated: ${timestamp}</p>
  ${JSON.stringify(results)}
</body>
</html>`
  return html
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  if (!command || command === "--help" || command === "-h") {
    console.log(`
${c.bold}Midnight Studio Validation CLI${c.reset}

${c.cyan}Usage:${c.reset}
  node cli/midnight-validate.mjs <command> [options]

${c.cyan}Commands:${c.reset}
  frontend   Run frontend page validation
  backend    Run backend API validation
  e2e        Run end-to-end integration tests
  full       Run all validations
  report     Generate HTML report from last run

${c.cyan}Options:${c.reset}
  --base-url <url>   Base URL (default: http://localhost:3000)
  --verbose          Show detailed output
  --json             Output results as JSON
  --out <file>       Save results to file
`)
    process.exit(0)
  }

  let results

  switch (command) {
    case "frontend":
      results = await runFrontend()
      break
    case "backend":
      results = await runBackend()
      break
    case "e2e":
      results = await runE2E()
      break
    case "full":
      results = await runFull()
      break
    case "report": {
      const lastRun = resolve(ROOT, "reports", "last-run.json")
      if (!existsSync(lastRun)) {
        console.log(`${c.red}No previous run found. Run 'full' first.${c.reset}`)
        process.exit(1)
      }
      const data = JSON.parse(readFileSync(lastRun, "utf-8"))
      const html = generateReport(data)
      const reportPath = resolve(ROOT, "reports", `report-${Date.now()}.html`)
      writeFileSync(reportPath, html)
      console.log(`${c.green}Report saved:${c.reset} ${reportPath}`)
      process.exit(0)
    }
    default:
      console.log(`${c.red}Unknown command: ${command}${c.reset}`)
      console.log(`Run with --help for usage info.`)
      process.exit(1)
  }

  // Save results
  if (results) {
    if (jsonOutput) {
      console.log(JSON.stringify(results, null, 2))
    }

    if (outFile) {
      writeFileSync(outFile, JSON.stringify(results, null, 2))
      console.log(`${c.green}Results saved:${c.reset} ${outFile}`)
    }

    // Always save last run
    const reportsDir = resolve(ROOT, "reports")
    if (!existsSync(reportsDir)) {
      const { mkdirSync } = await import("fs")
      mkdirSync(reportsDir, { recursive: true })
    }
    writeFileSync(resolve(reportsDir, "last-run.json"), JSON.stringify(results, null, 2))
  }

  // Exit with code 1 if any failures
  const hasFail = Array.isArray(results)
    ? results.some(r => r.summary?.fail > 0)
    : results?.summary?.fail > 0
  process.exit(hasFail ? 1 : 0)
}

main().catch(err => {
  console.error(`${c.red}Fatal:${c.reset} ${err.message}`)
  process.exit(1)
})
