import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const STORAGE_BUCKET = "marketing-posters";

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureBucketExists(supabase: any) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b: { name: string }) => b.name === STORAGE_BUCKET);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    });
    if (error) {
      console.error("Failed to create bucket:", error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY or GOOGLE_AI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, entity_type, entity_id } = body;

    if (!prompt || !entity_type || !entity_id) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, entity_type, entity_id" },
        { status: 400 }
      );
    }

    if (!["service", "product"].includes(entity_type)) {
      return NextResponse.json(
        { error: "entity_type must be 'service' or 'product'" },
        { status: 400 }
      );
    }

    // Attempt image generation via Gemini Imagen API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "9:16",
          safetyFilterLevel: "block_few",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);

      // If Imagen is not available, try Gemini generateContent with image output
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

      const fallbackResponse = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate an image: ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      });

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        console.error("Gemini fallback error:", fallbackError);
        return NextResponse.json(
          {
            error: "Image generation not available",
            details:
              "The Gemini Imagen API returned an error. Ensure the Imagen API is enabled in your Google Cloud project and your API key has access. " +
              "Primary error: " +
              errorText.substring(0, 200),
            image_url: null,
            placeholder: true,
          },
          { status: 422 }
        );
      }

      const fallbackData = await fallbackResponse.json();
      const parts = fallbackData.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find(
        (p: { inlineData?: { mimeType: string; data: string } }) =>
          p.inlineData?.mimeType?.startsWith("image/")
      );

      if (!imagePart?.inlineData) {
        return NextResponse.json(
          {
            error: "No image generated from fallback model",
            image_url: null,
            placeholder: true,
          },
          { status: 422 }
        );
      }

      // Upload fallback image to Supabase
      const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
      const imageUrl = await uploadToSupabase(
        imageBuffer,
        entity_type,
        entity_id,
        imagePart.inlineData.mimeType === "image/jpeg" ? "jpg" : "png"
      );

      return NextResponse.json({ image_url: imageUrl });
    }

    // Handle successful Imagen response
    const geminiData = await geminiResponse.json();
    const imageBase64 =
      geminiData.predictions?.[0]?.bytesBase64Encoded;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No image data in Gemini response", image_url: null },
        { status: 500 }
      );
    }

    const imageBuffer = Buffer.from(imageBase64, "base64");
    const imageUrl = await uploadToSupabase(
      imageBuffer,
      entity_type,
      entity_id,
      "png"
    );

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error("generate-image error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

async function uploadToSupabase(
  imageBuffer: Buffer,
  entityType: string,
  entityId: string,
  ext: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  await ensureBucketExists(supabase);

  const timestamp = Date.now();
  const filePath = `${entityType}s/${entityId}/${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, imageBuffer, {
      contentType: ext === "jpg" ? "image/jpeg" : "image/png",
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}
