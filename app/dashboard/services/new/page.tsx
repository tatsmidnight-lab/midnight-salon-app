"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoiceInput from "@/components/VoiceInput";
import {
  Mic,
  Type,
  Loader2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Clock,
} from "lucide-react";
import Link from "next/link";

type ServiceForm = {
  name: string;
  description: string;
  price: string;
  duration: string;
  imageUrl: string;
};

type InputMode = "voice" | "manual";

export default function NewServicePage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("voice");
  const [form, setForm] = useState<ServiceForm>({
    name: "",
    description: "",
    price: "",
    duration: "",
    imageUrl: "",
  });
  const [transcript, setTranscript] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVoiceTranscript = async (t: string) => {
    setTranscript(t);
    setExtracting(true);

    try {
      // Send transcript to n8n which will extract service details via AI
      const res = await fetch("/api/webhooks/artist-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: t,
          artistId: (() => { try { return JSON.parse(localStorage.getItem('salon_user') || '{}').artist_id || 'unknown' } catch { return 'unknown' } })(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // n8n returns extracted fields
        if (data.service) {
          setForm({
            name: data.service.name ?? "",
            description: data.service.description ?? "",
            price: String(data.service.price ?? ""),
            duration: String(data.service.duration ?? ""),
            imageUrl: data.service.image_url ?? "",
          });
        }
      }
    } catch {
      // If n8n fails, just show the transcript for manual editing
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.duration) {
      setError("Name, price, and duration are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/webhooks/artist-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          serviceName: form.name,
          description: form.description,
          price: Number(form.price),
          duration: Number(form.duration),
          imageUrl: form.imageUrl,
          mode: "create",
        }),
      });

      if (!res.ok) throw new Error("Failed to create service");

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Service Created!</h2>
        <p className="text-midnight-400">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-midnight-400 hover:text-gold-400 transition-colors text-sm mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Add New Service</h1>
        <p className="text-midnight-400">
          Describe your service by voice or fill in the details manually.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-midnight-900 border border-midnight-800 rounded-lg w-fit">
        <button
          onClick={() => setMode("voice")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === "voice"
              ? "bg-gold-500 text-midnight-950"
              : "text-midnight-400 hover:text-white"
          }`}
        >
          <Mic className="w-4 h-4" />
          Voice Input
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === "manual"
              ? "bg-gold-500 text-midnight-950"
              : "text-midnight-400 hover:text-white"
          }`}
        >
          <Type className="w-4 h-4" />
          Manual
        </button>
      </div>

      {/* Voice mode */}
      {mode === "voice" && (
        <div className="space-y-6 mb-6">
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            placeholder='Tap the mic and describe your service, e.g. "I offer a 90-minute balayage with toner for $180"'
          />

          {extracting && (
            <div className="flex items-center gap-2 text-gold-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <Sparkles className="w-4 h-4" />
              Extracting service details with AI...
            </div>
          )}

          {transcript && !extracting && (
            <div className="bg-midnight-800/50 border border-midnight-700 rounded-lg p-3">
              <p className="text-xs text-midnight-500 mb-1">Edit the extracted details below:</p>
            </div>
          )}
        </div>
      )}

      {/* Form fields — shown in manual mode, or after voice extraction */}
      {(mode === "manual" || transcript) && (
        <div className="bg-midnight-900 border border-midnight-800 rounded-xl p-6 space-y-4">
          <div>
            <Label className="text-midnight-300 text-xs mb-1 uppercase tracking-wider">
              Service Name *
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Balayage & Toner"
              className="bg-midnight-800 border-midnight-700 text-white placeholder:text-midnight-500"
            />
          </div>

          <div>
            <Label className="text-midnight-300 text-xs mb-1 uppercase tracking-wider">
              Description
            </Label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe what this service includes..."
              rows={3}
              className="w-full rounded-md border border-midnight-700 bg-midnight-800 px-3 py-2 text-sm text-white placeholder:text-midnight-500 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-midnight-300 text-xs mb-1 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Price (USD) *
              </Label>
              <Input
                type="number"
                min="0"
                step="5"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="180"
                className="bg-midnight-800 border-midnight-700 text-white placeholder:text-midnight-500"
              />
            </div>
            <div>
              <Label className="text-midnight-300 text-xs mb-1 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration (min) *
              </Label>
              <Input
                type="number"
                min="15"
                step="15"
                value={form.duration}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, duration: e.target.value }))
                }
                placeholder="90"
                className="bg-midnight-800 border-midnight-700 text-white placeholder:text-midnight-500"
              />
            </div>
          </div>

          <div>
            <Label className="text-midnight-300 text-xs mb-1 uppercase tracking-wider">
              Image URL (optional)
            </Label>
            <Input
              value={form.imageUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              placeholder="https://example.com/service-image.jpg"
              className="bg-midnight-800 border-midnight-700 text-white placeholder:text-midnight-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Service...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Create Service
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
