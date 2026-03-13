import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

async function callClaude(systemPrompt: string, userMessage: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || "";
}

async function generateImageDirect(
  prompt: string,
  entityType: string,
  entityId: string
): Promise<string | null> {
  // Try calling the local generate-image endpoint if APP_URL is set
  if (APP_URL) {
    try {
      const res = await fetch(`${APP_URL}/api/ai/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          entity_type: entityType,
          entity_id: entityId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.image_url || null;
      }
    } catch (err) {
      console.error("Local generate-image call failed, trying direct:", err);
    }
  }

  // Direct Gemini fallback if local endpoint is unavailable
  if (!GEMINI_API_KEY) return null;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `Generate an image: ${prompt}` }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find(
      (p: { inlineData?: { mimeType: string; data: string } }) =>
        p.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData) return null;

    // Upload to Supabase
    const supabase = getSupabaseAdmin();
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === "marketing-posters")) {
      await supabase.storage.createBucket("marketing-posters", {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
      });
    }

    const ext =
      imagePart.inlineData.mimeType === "image/jpeg" ? "jpg" : "png";
    const timestamp = Date.now();
    const filePath = `${entityType}s/${entityId}/${timestamp}.${ext}`;
    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");

    const { error: uploadError } = await supabase.storage
      .from("marketing-posters")
      .upload(filePath, imageBuffer, {
        contentType: imagePart.inlineData.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("marketing-posters").getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error("Direct Gemini image generation failed:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      type,
      entity_id,
      name,
      description,
      price,
      category,
      admin_focus,
      count = 3,
    } = body;

    if (!type || !entity_id || !name) {
      return NextResponse.json(
        { error: "Missing required fields: type, entity_id, name" },
        { status: 400 }
      );
    }

    const suggestionCount = Math.min(Math.max(1, count), 5);

    // Step 1: Generate marketing copy suggestions via Claude
    const systemPrompt = `You are a creative marketing director for an edgy, high-end beauty salon with a "tattoo gang" brand aesthetic.
You create marketing content that is bold, trendy, and appeals to a young, style-conscious audience.

You must respond with ONLY a valid JSON array, no other text. No markdown code fences.`;

    const userMessage = `Generate ${suggestionCount} unique marketing poster suggestions for this salon ${type}:

Name: ${name}
Description: ${description || "N/A"}
Price: ${price || "N/A"}
Category: ${category || "General"}
${admin_focus ? `Admin creative direction: ${admin_focus}` : ""}

For each suggestion, provide:
1. "copy" — Short, punchy marketing copy for the poster (2-3 lines max, include the price if provided)
2. "image_prompt" — A detailed image generation prompt following this aesthetic:
   - Dark/black background with dramatic lighting
   - Neon glow accents (hot pink, electric purple, cyan)
   - Gold and rose-gold metallic highlights
   - Geometric patterns, clean lines
   - Vertical 9:16 composition (1080x1920 Instagram Story)
   - Space for text overlay
   - Related to "${name}" visually

Return a JSON array of objects with "copy" and "image_prompt" fields.`;

    const claudeResponse = await callClaude(systemPrompt, userMessage);

    let suggestions: Array<{ copy: string; image_prompt: string }>;
    try {
      // Strip markdown fences if Claude included them despite instructions
      const cleaned = claudeResponse
        .replace(/^```(?:json)?\s*/m, "")
        .replace(/\s*```$/m, "")
        .trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude suggestions:", claudeResponse);
      return NextResponse.json(
        {
          error: "Failed to parse marketing suggestions from Claude",
          raw_response: claudeResponse.substring(0, 500),
        },
        { status: 500 }
      );
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return NextResponse.json(
        { error: "No suggestions generated" },
        { status: 500 }
      );
    }

    // Step 2: Generate images for each suggestion
    const results: Array<{
      copy: string;
      image_url: string | null;
      prompt: string;
    }> = [];

    for (const suggestion of suggestions) {
      const imageUrl = await generateImageDirect(
        suggestion.image_prompt,
        type,
        entity_id
      );

      results.push({
        copy: suggestion.copy,
        image_url: imageUrl,
        prompt: suggestion.image_prompt,
      });
    }

    // Step 3: Save suggestions to Supabase
    const supabase = getSupabaseAdmin();
    const table = type === "service" ? "services" : "products";

    const { error: updateError } = await supabase
      .from(table)
      .update({ marketing_suggestions: results })
      .eq("id", entity_id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      // Still return results even if save fails
      return NextResponse.json({
        suggestions: results,
        warning: `Generated successfully but failed to save to database: ${updateError.message}`,
      });
    }

    return NextResponse.json({ suggestions: results });
  } catch (error) {
    console.error("generate-poster-suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
