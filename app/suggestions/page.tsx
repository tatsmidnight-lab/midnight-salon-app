"use client";

import { useState } from "react";
import VoiceInput from "@/components/VoiceInput";
import SuggestionCard, { type Suggestion } from "@/components/SuggestionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Search, Mic } from "lucide-react";

export default function SuggestionsPage() {
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch("/api/webhooks/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: query }),
      });

      if (!res.ok) throw new Error("Failed to get suggestions");

      const data = await res.json();
      setSuggestions(data.suggestions ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Show demo suggestions as fallback
      setSuggestions(DEMO_SUGGESTIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (t: string) => {
    setTranscript(t);
    setTextInput(t);
    handleSearch(t);
  };

  const handleTextSearch = () => handleSearch(textInput);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 text-gold-400 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          AI-Powered
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Service Suggestions
        </h1>
        <p className="text-midnight-400 text-lg max-w-xl mx-auto">
          Describe what you&apos;re looking for — by voice or text — and our AI
          will recommend the perfect services for you.
        </p>
      </div>

      {/* Input section */}
      <div className="max-w-2xl mx-auto mb-10 space-y-6">
        {/* Voice input */}
        <div>
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Mic className="w-4 h-4 text-gold-400" />
            Speak Your Request
          </h3>
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            placeholder="Tap the mic and describe what you want — e.g. 'I want my hair lighter with beach waves for summer'"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-midnight-600">
          <div className="flex-1 h-px bg-midnight-800" />
          <span className="text-sm">or type your request</span>
          <div className="flex-1 h-px bg-midnight-800" />
        </div>

        {/* Text input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-500" />
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextSearch()}
              placeholder="e.g. 'I want a dramatic color change and blowout'"
              className="pl-10 bg-midnight-900 border-midnight-700 text-white placeholder:text-midnight-500 focus:border-gold-500"
            />
          </div>
          <Button
            variant="gold"
            onClick={handleTextSearch}
            disabled={loading || !textInput.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Suggest
              </>
            )}
          </Button>
        </div>

        {transcript && (
          <div className="text-xs text-midnight-500 text-center">
            Searching for: <span className="text-midnight-300 italic">"{transcript}"</span>
          </div>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <div className="w-16 h-16 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          <p className="text-midnight-400">Finding the perfect services for you...</p>
        </div>
      )}

      {error && !loading && suggestions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="outline" onClick={() => handleSearch(textInput)} className="border-midnight-700 text-midnight-300">
            Try Again
          </Button>
        </div>
      )}

      {!loading && hasSearched && suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-gold-400" />
            <h2 className="text-xl font-bold text-white">
              {suggestions.length} Personalized Suggestions
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasSearched && !loading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gold-500/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-12 h-12 text-gold-500/40" />
          </div>
          <p className="text-midnight-500 text-lg">
            Your AI suggestions will appear here
          </p>
          <p className="text-midnight-600 text-sm mt-1">
            Use the voice or text input above to get started
          </p>
        </div>
      )}
    </div>
  );
}

// Demo suggestions shown when API is unavailable
const DEMO_SUGGESTIONS: Suggestion[] = [
  {
    service_name: "Balayage & Toning",
    description:
      "Hand-painted highlights with a custom gloss toner for natural, sun-kissed color.",
    reasoning:
      "Perfect for a low-maintenance lighter look — grows out beautifully without harsh lines.",
    estimated_price: 180,
    estimated_duration: 150,
    artist_name: "Luna Reyes",
    confidence_score: 0.92,
  },
  {
    service_name: "Beachy Waves Styling",
    description:
      "Loose, effortless waves styled with sea-salt spray for that perfect summer look.",
    reasoning:
      "Complements lighter color beautifully and gives that relaxed, coastal feel.",
    estimated_price: 75,
    estimated_duration: 45,
    confidence_score: 0.87,
  },
  {
    service_name: "Deep Conditioning Treatment",
    description:
      "Intensive moisture repair with Olaplex to protect hair during and after color.",
    reasoning:
      "Lightening can stress hair — this treatment restores health and shine.",
    estimated_price: 55,
    estimated_duration: 30,
    confidence_score: 0.78,
  },
];
