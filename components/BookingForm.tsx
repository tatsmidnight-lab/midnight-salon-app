"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import CalendarPicker from "@/components/CalendarPicker";
import ProductSelector from "@/components/ProductSelector";
import { Artist, Service, Product } from "@/lib/supabase/types";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatTime,
  cn,
} from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Scissors,
  Calendar,
  Package,
  CreditCard,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

const STEPS = [
  { id: 1, label: "Artist", icon: User },
  { id: 2, label: "Service", icon: Scissors },
  { id: 3, label: "Schedule", icon: Calendar },
  { id: 4, label: "Add-ons", icon: Package },
  { id: 5, label: "Confirm", icon: CreditCard },
];

interface BookingState {
  artistId: string;
  serviceId: string;
  date: Date | undefined;
  time: string;
  productIds: string[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
}

export default function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [booking, setBooking] = useState<BookingState>({
    artistId: searchParams.get("artist") || "",
    serviceId: searchParams.get("service") || "",
    date: undefined,
    time: "",
    productIds: [],
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });

  // Skip to step 2 if artist preselected, step 3 if both selected
  useEffect(() => {
    if (booking.artistId && booking.serviceId) setStep(3);
    else if (booking.artistId) setStep(2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch artists
  const { data: artists = [], isLoading: loadingArtists } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: () => fetch("/api/artists").then((r) => r.json()),
  });

  // Fetch services for selected artist
  const { data: services = [], isLoading: loadingServices } = useQuery<Service[]>({
    queryKey: ["services", booking.artistId],
    queryFn: () =>
      fetch(`/api/artists/${booking.artistId}`).then((r) =>
        r.json().then((d: { services: Service[] }) => d.services ?? [])
      ),
    enabled: !!booking.artistId,
  });

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/services").then((r) => r.json()),
  });

  const selectedArtist = artists.find((a) => a.id === booking.artistId);
  const selectedService = services.find((s) => s.id === booking.serviceId);

  const canProceed = () => {
    switch (step) {
      case 1: return !!booking.artistId;
      case 2: return !!booking.serviceId;
      case 3: return !!booking.date && !!booking.time;
      case 4: return true;
      case 5:
        return !!(
          booking.customerName &&
          booking.customerEmail &&
          booking.customerPhone
        );
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/webhooks/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: booking.artistId,
          serviceId: booking.serviceId,
          date: booking.date ? format(booking.date, "yyyy-MM-dd") : "",
          time: booking.time,
          productIds: booking.productIds,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          notes: booking.notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(
          `/book/confirm?booking=${data.bookingId || "new"}&service=${encodeURIComponent(
            selectedService?.name ?? ""
          )}&artist=${encodeURIComponent(selectedArtist?.name ?? "")}&date=${
            booking.date ? format(booking.date, "yyyy-MM-dd") : ""
          }&time=${booking.time}&price=${totalPrice}`
        );
      }
    } catch {
      alert("Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const addonTotal = products
    .filter((p) => booking.productIds.includes(p.id))
    .reduce((s, p) => s + p.price, 0);
  const totalPrice = (selectedService?.price ?? 0) + addonTotal;

  const toggleProduct = (id: string) => {
    setBooking((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((p) => p !== id)
        : [...prev.productIds, id],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isComplete = step > s.id;
          const isCurrent = step === s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isComplete
                      ? "bg-gold-500 border-gold-500 text-midnight-950"
                      : isCurrent
                      ? "bg-midnight-800 border-gold-500 text-gold-400"
                      : "bg-midnight-900 border-midnight-700 text-midnight-600"
                  )}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs hidden sm:block",
                    isCurrent ? "text-gold-400" : isComplete ? "text-midnight-300" : "text-midnight-600"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    step > s.id ? "bg-gold-500" : "bg-midnight-800"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-midnight-900 border border-midnight-800 rounded-xl p-6 min-h-[400px]">

        {/* Step 1: Select Artist */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">Choose Your Artist</h2>
            {loadingArtists ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-3">
                {artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() =>
                      setBooking((prev) => ({ ...prev, artistId: artist.id, serviceId: "" }))
                    }
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                      booking.artistId === artist.id
                        ? "border-gold-500 bg-gold-500/5"
                        : "border-midnight-700 hover:border-midnight-500"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full bg-midnight-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {artist.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-midnight-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{artist.name}</p>
                      <p className="text-midnight-400 text-sm line-clamp-1">{artist.bio}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {artist.services?.slice(0, 2).map((s) => (
                          <Badge key={s} variant="midnight" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    {booking.artistId === artist.id && (
                      <Check className="w-5 h-5 text-gold-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Service */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">
              Select a Service
              {selectedArtist && (
                <span className="text-gold-400 font-normal text-base ml-2">
                  — {selectedArtist.name}
                </span>
              )}
            </h2>
            {loadingServices ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              </div>
            ) : services.length === 0 ? (
              <p className="text-midnight-400 text-center py-8">
                No services found for this artist.
              </p>
            ) : (
              <div className="grid gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() =>
                      setBooking((prev) => ({ ...prev, serviceId: service.id }))
                    }
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border text-left transition-all",
                      booking.serviceId === service.id
                        ? "border-gold-500 bg-gold-500/5"
                        : "border-midnight-700 hover:border-midnight-500"
                    )}
                  >
                    <div className="w-14 h-14 rounded-lg bg-midnight-800 flex-shrink-0 overflow-hidden">
                      {service.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Scissors className="w-6 h-6 text-midnight-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-semibold">{service.name}</p>
                        <Badge variant="gold">{formatCurrency(service.price)}</Badge>
                      </div>
                      <p className="text-midnight-400 text-sm mt-1 line-clamp-2">{service.description}</p>
                      <p className="text-midnight-500 text-xs mt-1">{formatDuration(service.duration)}</p>
                    </div>
                    {booking.serviceId === service.id && (
                      <Check className="w-5 h-5 text-gold-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div>
            <h2 className="text-white text-xl font-bold mb-4">Pick a Date & Time</h2>
            <CalendarPicker
              selectedDate={booking.date}
              selectedTime={booking.time}
              onDateChange={(date) => setBooking((prev) => ({ ...prev, date }))}
              onTimeChange={(time) => setBooking((prev) => ({ ...prev, time }))}
            />
          </div>
        )}

        {/* Step 4: Add-ons */}
        {step === 4 && (
          <div>
            <h2 className="text-white text-xl font-bold mb-1">Add-on Products</h2>
            <p className="text-midnight-400 text-sm mb-4">
              Enhance your experience with optional products
            </p>
            <ProductSelector
              products={products}
              selectedIds={booking.productIds}
              onToggle={toggleProduct}
            />
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-white text-xl font-bold">Confirm Your Booking</h2>

            {/* Summary */}
            <div className="bg-midnight-800 rounded-lg p-4 space-y-2 text-sm">
              {selectedArtist && (
                <div className="flex justify-between">
                  <span className="text-midnight-400">Artist</span>
                  <span className="text-white font-medium">{selectedArtist.name}</span>
                </div>
              )}
              {selectedService && (
                <>
                  <div className="flex justify-between">
                    <span className="text-midnight-400">Service</span>
                    <span className="text-white font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-400">Duration</span>
                    <span className="text-white">{formatDuration(selectedService.duration)}</span>
                  </div>
                </>
              )}
              {booking.date && (
                <div className="flex justify-between">
                  <span className="text-midnight-400">Date</span>
                  <span className="text-white">{formatDate(format(booking.date, "yyyy-MM-dd"))}</span>
                </div>
              )}
              {booking.time && (
                <div className="flex justify-between">
                  <span className="text-midnight-400">Time</span>
                  <span className="text-white">{formatTime(booking.time)}</span>
                </div>
              )}
              {booking.productIds.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-midnight-400">Add-ons</span>
                  <span className="text-white">
                    +{formatCurrency(addonTotal)}
                  </span>
                </div>
              )}
              <div className="border-t border-midnight-700 pt-2 flex justify-between font-semibold">
                <span className="text-midnight-200">Total</span>
                <span className="text-gold-400 text-base">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-3">
              <h3 className="text-white font-medium">Your Details</h3>
              <div>
                <Label className="text-midnight-300 text-xs mb-1">Full Name *</Label>
                <Input
                  value={booking.customerName}
                  onChange={(e) =>
                    setBooking((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  placeholder="Your full name"
                  className="bg-midnight-800 border-midnight-700 text-white placeholder:text-midnight-500"
                />
              </div>
              <div>
                <Label className="text-midnight-300 text-xs mb-1">Email *</Label>
                <Input
                  type="email"
                  value={booking.customerEmail}
                  onChange={(e) =>
                    setBooking((prev) => ({ ...prev, customerEmail: e.target.value }))
                  }
                  placeholder="your@email.com"
                  className="bg-midnight-800 border-midnight-700 text-white placeholder:text-midnight-500"
                />
              </div>
              <div>
                <Label className="text-midnight-300 text-xs mb-1">Phone *</Label>
                <Input
                  type="tel"
                  value={booking.customerPhone}
                  onChange={(e) =>
                    setBooking((prev) => ({ ...prev, customerPhone: e.target.value }))
                  }
                  placeholder="+1 (555) 000-0000"
                  className="bg-midnight-800 border-midnight-700 text-white placeholder:text-midnight-500"
                />
              </div>
              <div>
                <Label className="text-midnight-300 text-xs mb-1">Notes (optional)</Label>
                <textarea
                  value={booking.notes}
                  onChange={(e) =>
                    setBooking((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Any special requests or notes..."
                  rows={2}
                  className="w-full rounded-md border border-midnight-700 bg-midnight-800 px-3 py-2 text-sm text-white placeholder:text-midnight-500 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="border-midnight-700 text-midnight-300 hover:text-white hover:border-midnight-500"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {step < 5 ? (
          <Button
            variant="gold"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            variant="gold"
            size="lg"
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="min-w-[160px]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Confirm & Pay
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
