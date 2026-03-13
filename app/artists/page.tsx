import { createClient } from "@/lib/supabase/server";
import ArtistCard from "@/components/ArtistCard";
import { Scissors } from "lucide-react";

export const revalidate = 60;

export default async function ArtistsPage() {
  const supabase = createClient();
  const { data: rawArtists } = await supabase
    .from("artists")
    .select("*")
    .eq("is_active", true)
    .order("created_at");

  // Join with users table for display names
  const userIds = (rawArtists ?? []).map((a) => a.user_id).filter(Boolean);
  const { data: users } = userIds.length > 0
    ? await supabase.from("users").select("id, display_name, avatar_url").in("id", userIds)
    : { data: [] };
  const userMap = new Map((users ?? []).map((u: { id: string; display_name: string; avatar_url: string }) => [u.id, u]));

  const artists = (rawArtists ?? []).map((a) => {
    const user = userMap.get(a.user_id);
    return {
      ...a,
      name: user?.display_name || "Artist",
      avatar_url: a.profile_image || user?.avatar_url || null,
      services: a.specialties || [],
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 text-gold-400 text-sm font-medium mb-4">
          <Scissors className="w-4 h-4" />
          Our Team
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Meet Our Artists
        </h1>
        <p className="text-midnight-400 text-lg max-w-xl mx-auto">
          Each artist brings a unique perspective and set of skills. Find the
          perfect match for your style vision.
        </p>
      </div>

      {/* Artists grid */}
      {artists && artists.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <Scissors className="w-16 h-16 text-midnight-700 mx-auto mb-4" />
          <p className="text-midnight-400 text-lg">
            No artists available yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
