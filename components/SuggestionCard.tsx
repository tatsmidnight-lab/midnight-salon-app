import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Sparkles } from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils";

export type Suggestion = {
  id?: string;
  service_name: string;
  description: string;
  reasoning: string;
  estimated_price: number;
  estimated_duration: number;
  artist_name?: string;
  artist_id?: string;
  service_id?: string;
  image_url?: string;
  confidence_score?: number;
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  index?: number;
}

export default function SuggestionCard({
  suggestion,
  index = 0,
}: SuggestionCardProps) {
  const confidenceLabel =
    (suggestion.confidence_score ?? 0.85) > 0.8
      ? "High Match"
      : (suggestion.confidence_score ?? 0.85) > 0.6
      ? "Good Match"
      : "Possible Match";

  return (
    <Card className="overflow-hidden border-midnight-800 bg-midnight-900 hover:border-gold-500/40 transition-all duration-300 animate-fade-in">
      {/* Image / gradient header */}
      <div className="relative h-36 bg-gradient-to-br from-midnight-800 via-midnight-900 to-midnight-950 overflow-hidden">
        {suggestion.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={suggestion.image_url}
            alt={suggestion.service_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-gold-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/80 to-transparent" />

        {/* Ranking badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="midnight" className="text-xs font-bold">
            #{index + 1} Pick
          </Badge>
        </div>

        {/* Match confidence */}
        <div className="absolute top-2 right-2">
          <Badge variant="gold" className="text-xs">
            {confidenceLabel}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-white font-semibold text-base">
            {suggestion.service_name}
          </h3>
          {suggestion.artist_name && (
            <p className="text-gold-400 text-xs mt-0.5">
              by {suggestion.artist_name}
            </p>
          )}
        </div>

        <p className="text-midnight-300 text-sm line-clamp-2">
          {suggestion.description}
        </p>

        {/* AI reasoning */}
        <div className="bg-midnight-800/50 border border-midnight-700 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-gold-400" />
            <span className="text-xs text-gold-400 font-medium">Why this fits you</span>
          </div>
          <p className="text-midnight-300 text-xs line-clamp-2">
            {suggestion.reasoning}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-midnight-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(suggestion.estimated_duration)}
          </span>
          <span className="flex items-center gap-1 text-gold-400 font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            {formatCurrency(suggestion.estimated_price)}
          </span>
        </div>

        {suggestion.service_id ? (
          <Link
            href={`/book?service=${suggestion.service_id}${suggestion.artist_id ? `&artist=${suggestion.artist_id}` : ""}`}
          >
            <Button variant="gold" size="sm" className="w-full">
              Book This Service
            </Button>
          </Link>
        ) : (
          <Link href="/book">
            <Button variant="outline" size="sm" className="w-full border-midnight-600 text-midnight-200 hover:border-gold-500 hover:text-gold-400">
              Browse Similar Services
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
