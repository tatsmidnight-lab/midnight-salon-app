import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const userId = formData.get("user_id") as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or user_id" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `avatars/${userId}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      // Try creating the bucket first if it doesn't exist
      await supabaseAdmin.storage.createBucket("avatars", { public: true })
      const { error: retryError } = await supabaseAdmin.storage
        .from("avatars")
        .upload(fileName, buffer, { contentType: file.type, upsert: true })
      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 })
      }
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(fileName)

    const avatarUrl = urlData.publicUrl

    // Update user record
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ avatar_url: avatarUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
