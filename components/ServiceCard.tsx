import Link from "next/link";
import { Service } from "@/lib/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Image as ImageIcon } from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  artistName?: string;
  showBookButton?: boolean;
}

export default function ServiceCard({
  service,
  artistName,
  showBookButton = true,
}: ServiceCardProps) {
  return (
    <Card className="group overflow-hidden border-midnight-800 bg-midnight-900 hover:border-gold-500/40 transition-all duration-300">
      {/* Service image */}
      <div className="relative h-40 bg-gradient-to-br from-midnight-800 to-midnight-950 overflow-hidden">
        {service.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-midnight-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/60 to-transparent" />
        <div className="absolute top-2 right-2">
          <Badge variant="gold" className="font-bold text-sm">
            {formatCurrency(service.price)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-2">
        <div>
          <h3 className="text-white font-semibold text-base">{service.name}</h3>
          {artistName && (
            <p className="text-gold-400 text-xs mt-0.5">by {artistName}</p>
          )}
        </div>

        <p className="text-midnight-300 text-sm line-clamp-2">
          {service.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-midnight-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(service.duration)}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            {formatCurrency(service.price)}
          </span>
        </div>

        {showBookButton && (
          <Link
            href={`/book?service=${service.id}&artist=${service.artist_id}`}
          >
            <Button variant="gold" size="sm" className="w-full mt-2">
              Book This Service
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
