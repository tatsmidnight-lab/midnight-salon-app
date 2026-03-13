import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { type, name, description, category, admin_focus } = body;

    if (!type || !name) {
      return NextResponse.json(
        { error: "Missing required fields: type, name" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert visual art director specializing in beauty salon marketing imagery.
You generate detailed image prompts for AI image generators (Google Imagen / Gemini).

Your aesthetic is "tattoo gang" — bold, trendy, edgy beauty brand vibes:
- Dark/black backgrounds with dramatic lighting
- Neon glow accents (hot pink, electric purple, cyan)
- Gold and rose-gold metallic highlights
- Geometric patterns, clean lines, symmetry
- High-contrast, magazine-quality composition
- Luxury meets street-art energy

Output ONLY the image prompt text. No explanations, no markdown, no quotes.
The image must be suitable for Instagram Stories at 1080x1920 pixels (9:16 vertical).`;

    const userMessage = `Generate a detailed image prompt for a salon ${type === "service" ? "service" : "product"} marketing poster.

Details:
- Name: ${name}
- Description: ${description || "N/A"}
- Category: ${category || "General"}
${admin_focus ? `- Creative focus/direction from admin: ${admin_focus}` : ""}

Requirements:
- Vertical composition optimized for 1080x1920 (Instagram Story)
- "Tattoo gang" aesthetic: dark background, neon accents, gold/pink highlights, geometric elements
- Must prominently feature visual elements related to "${name}"
- Include space for text overlay (top and bottom thirds)
- Professional, high-end beauty salon branding
- Photorealistic style with stylized lighting effects`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Anthropic API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate image prompt", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const prompt = data.content?.[0]?.text?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Empty response from Claude" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("generate-image-prompt error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
