import { NextRequest, NextResponse } from "next/server"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 })
  }

  let body: { prompt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 })
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are a product consultant for Midnight Studio, a tattoo and piercing studio in the UK.

Based on the admin's request below, suggest products in JSON format.

IMPORTANT: Return ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array.

Each product object must have these exact fields:
- "name": string (product name)
- "description": string (1-2 sentences)
- "price": number (in GBP, e.g. 12.99)
- "category": string (one of: "aftercare", "jewellery", "merch", "gift_card")
- "stock": number (suggested initial stock quantity)

Admin request:
${body.prompt}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[suggest-products] Claude error:", err)
      return NextResponse.json({ error: "AI request failed" }, { status: 502 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || "[]"

    // Parse JSON from response (handle potential markdown fences)
    let products
    try {
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
      products = JSON.parse(cleaned)
    } catch {
      console.error("[suggest-products] Failed to parse:", text.slice(0, 200))
      return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 })
    }

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "AI did not return an array" }, { status: 500 })
    }

    return NextResponse.json({ products })
  } catch (err) {
    console.error("[suggest-products]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
