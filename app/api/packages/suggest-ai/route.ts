import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { admin_focus, services, products } = body

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 })
    }

    const serviceList = (services || [])
      .map((s: { name: string; price: number }) => `- ${s.name} (£${s.price})`)
      .join("\n")

    const productList = (products || [])
      .map((p: { name: string; price: number }) => `- ${p.name} (£${p.price})`)
      .join("\n")

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `You are a marketing specialist for Midnight Studio, a tattoo and piercing salon. Create 3-5 package bundle suggestions.

Available services:
${serviceList}

Available products:
${productList}

Admin focus: ${admin_focus || "general promotional packages"}

Return ONLY a JSON array of objects with these fields:
- name: catchy package name
- description: 1-2 sentence marketing description
- services: array of service names from the list above that should be included
- products: array of product names to include as free add-ons
- discount: recommended discount percentage (5-30)

Think about complementary services (e.g. tattoo + aftercare, piercing + jewellery).
Return valid JSON only, no markdown or explanation.`,
        }],
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Claude API failed" }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || "[]"

    let suggestions
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      suggestions = []
    }

    // Map service/product names back to IDs
    const svcMap = new Map((services || []).map((s: { id: string; name: string }) => [s.name, s.id]))
    const prodMap = new Map((products || []).map((p: { id: string; name: string }) => [p.name, p.id]))

    const mapped = suggestions.map((s: { name: string; description: string; services: string[]; products: string[]; discount: number }) => ({
      ...s,
      services: (s.services || []).map((name: string) => svcMap.get(name)).filter(Boolean),
      products: (s.products || []).map((name: string) => prodMap.get(name)).filter(Boolean),
    }))

    return NextResponse.json({ suggestions: mapped })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
