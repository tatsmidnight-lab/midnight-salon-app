import Link from "next/link";
import { Artist } from "@/lib/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCircle2, Scissors } from "lucide-react";

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Card className="group overflow-hidden border-midnight-800 bg-midnight-900 hover:border-gold-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/10">
      {/* Avatar area */}
      <div className="relative h-48 bg-gradient-to-br from-midnight-800 to-midnight-950 flex items-center justify-center overflow-hidden">
        {artist.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatar_url}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-midnight-600">
            <UserCircle2 className="w-20 h-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/80 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <h3 className="text-white font-bold text-xl">{artist.name}</h3>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <p className="text-midnight-300 text-sm line-clamp-2">{artist.bio}</p>

        {/* Services tags */}
        {artist.services && artist.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {artist.services.slice(0, 3).map((service) => (
              <Badge key={service} variant="midnight" className="text-xs">
                <Scissors className="w-3 h-3 mr-1" />
                {service}
              </Badge>
            ))}
            {artist.services.length > 3 && (
              <Badge variant="outline" className="text-xs text-midnight-400 border-midnight-700">
                +{artist.services.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Link href={`/artists/${artist.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full border-midnight-600 text-midnight-200 hover:border-gold-500 hover:text-gold-400">
              View Profile
            </Button>
          </Link>
          <Link href={`/book?artist=${artist.id}`} className="flex-1">
            <Button variant="gold" size="sm" className="w-full">
              Book Now
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
