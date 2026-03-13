import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/ServiceCard";
import { User, ArrowLeft, Scissors, Star } from "lucide-react";

export const revalidate = 60;

interface Props {
  params: { id: string };
}

export default async function ArtistDetailPage({ params }: Props) {
  const supabase = createClient();

  const [{ data: rawArtist }, { data: services }] = await Promise.all([
    supabase.from("artists").select("*").eq("id", params.id).single(),
    supabase.from("services").select("*").eq("artist_id", params.id).order("created_at"),
  ]);

  if (!rawArtist) notFound();

  // Get user display name
  let artistName = "Artist";
  let avatarUrl = rawArtist.profile_image || null;
  if (rawArtist.user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("display_name, avatar_url")
      .eq("id", rawArtist.user_id)
      .single();
    if (user) {
      artistName = user.display_name || "Artist";
      avatarUrl = avatarUrl || user.avatar_url || null;
    }
  }

  const artist = {
    ...rawArtist,
    name: artistName,
    avatar_url: avatarUrl,
    services: rawArtist.specialties || [],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/artists"
        className="inline-flex items-center gap-1.5 text-midnight-400 hover:text-gold-400 transition-colors text-sm mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        All Artists
      </Link>

      {/* Artist profile */}
      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        {/* Avatar */}
        <div className="lg:col-span-1">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-midnight-800 to-midnight-950 aspect-square max-w-xs mx-auto lg:max-w-full">
            {artist.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artist.avatar_url}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-24 h-24 text-midnight-700" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-2 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="gold" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              Featured Artist
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">{artist.name}</h1>
          <p className="text-midnight-300 text-lg leading-relaxed mb-6">
            {artist.bio}
          </p>

          {/* Specialties */}
          {artist.services && artist.services.length > 0 && (
            <div className="mb-6">
              <h3 className="text-midnight-400 text-sm font-medium uppercase tracking-wider mb-2">
                Specialties
              </h3>
              <div className="flex flex-wrap gap-2">
                {artist.services.map((s: string) => (
                  <Badge key={s} variant="midnight" className="text-sm">
                    <Scissors className="w-3 h-3 mr-1.5" />
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link href={`/book?artist=${artist.id}`}>
              <Button variant="gold" size="lg">
                Book with {artist.name.split(" ")[0]}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Services */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Scissors className="w-6 h-6 text-gold-400" />
          Services by {artist.name}
        </h2>

        {services && services.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} artistName={artist.name} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-midnight-800 rounded-xl">
            <Scissors className="w-12 h-12 text-midnight-700 mx-auto mb-3" />
            <p className="text-midnight-400">No services listed yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
