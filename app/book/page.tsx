import { Suspense } from "react";
import BookingForm from "@/components/BookingForm";
import { Loader2, Scissors } from "lucide-react";

export default function BookPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 text-gold-400 text-sm font-medium mb-4">
          <Scissors className="w-4 h-4" />
          Online Booking
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
          Book Your Appointment
        </h1>
        <p className="text-midnight-400 text-lg max-w-xl mx-auto">
          Follow the steps below to schedule your perfect salon experience.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
          </div>
        }
      >
        <BookingForm />
      </Suspense>
    </div>
  );
}
