/**
 * Update Kia's profile in Supabase
 * - Ensure user with phone "+447958747929" has role "artist"
 * - Set display_name to "Kia", email to "kia@midnightt.top"
 * - Set profile_image on artists table to a portfolio photo
 *
 * Run: node scripts/update-kia-profile.cjs
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local
const env = {};
fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
  .split("\n")
  .forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const eq = t.indexOf("=");
    if (eq === -1) return;
    env[t.slice(0, eq)] = t.slice(eq + 1);
  });

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const PHONE = "+447958747929";
const PROFILE_IMAGE = "/videos/photo_1_2026-03-13_12-03-02.jpg";

async function main() {
  console.log("=== Updating Kia's profile ===\n");

  // 1. Find user by phone
  console.log(`Looking up user with phone ${PHONE}...`);
  const { data: user, error: findErr } = await supabase
    .from("users")
    .select("id, display_name, email, role")
    .eq("phone", PHONE)
    .single();

  if (findErr || !user) {
    console.error("Could not find user:", findErr?.message || "no rows returned");
    process.exit(1);
  }

  console.log("  Found user:", user.id);
  console.log("  Current: display_name=%s, email=%s, role=%s", user.display_name, user.email, user.role);

  // 2. Update user: role, display_name, email
  console.log("\nUpdating user record...");
  const { error: userUpdateErr } = await supabase
    .from("users")
    .update({
      role: "artist",
      display_name: "Kia",
      email: "kia@midnightt.top",
    })
    .eq("id", user.id);

  if (userUpdateErr) {
    console.error("  User update error:", userUpdateErr.message);
  } else {
    console.log("  User updated: role=artist, display_name=Kia, email=kia@midnightt.top");
  }

  // 3. Find artist record for this user
  console.log("\nLooking up artist record for user_id:", user.id);
  const { data: artist, error: artistFindErr } = await supabase
    .from("artists")
    .select("id, profile_image")
    .eq("user_id", user.id)
    .single();

  if (artistFindErr || !artist) {
    console.error("  No artist record found:", artistFindErr?.message || "no rows");
    console.log("  Skipping profile_image update (no artist row to update).");
    return;
  }

  console.log("  Found artist:", artist.id);
  console.log("  Current profile_image:", artist.profile_image);

  // 4. Update artist profile_image
  console.log("\nSetting profile_image to:", PROFILE_IMAGE);
  const { error: artistUpdateErr } = await supabase
    .from("artists")
    .update({ profile_image: PROFILE_IMAGE })
    .eq("id", artist.id);

  if (artistUpdateErr) {
    console.error("  Artist update error:", artistUpdateErr.message);
  } else {
    console.log("  Artist profile_image updated successfully.");
  }

  // 5. Verify
  console.log("\n=== Verification ===");
  const { data: verifyUser } = await supabase
    .from("users")
    .select("id, display_name, email, role, phone")
    .eq("id", user.id)
    .single();
  console.log("  User:", verifyUser);

  const { data: verifyArtist } = await supabase
    .from("artists")
    .select("id, user_id, profile_image")
    .eq("id", artist.id)
    .single();
  console.log("  Artist:", verifyArtist);

  console.log("\n=== Done! ===");
}

main().catch(console.error);
