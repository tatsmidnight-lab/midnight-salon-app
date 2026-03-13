import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Scissors,
  CreditCard,
  ArrowRight,
  Home,
} from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

interface ConfirmPageProps {
  searchParams: {
    booking?: string;
    service?: string;
    artist?: string;
    date?: string;
    time?: string;
    price?: string;
  };
}

function ConfirmationContent({ searchParams }: ConfirmPageProps) {
  const { booking, service, artist, date, time, price } = searchParams;
  const bookingRef = booking
    ? `MS-${booking.slice(0, 8).toUpperCase()}`
    : "MS-PENDING";

  // Build Square payment link (placeholder — replace with real Square link)
  const squarePayLink = `https://squareup.com/appointments/pay?ref=${bookingRef}&amount=${price ?? 0}`;

  const details = [
    { icon: User, label: "Artist", value: artist || "—" },
    { icon: Scissors, label: "Service", value: service || "—" },
    {
      icon: Calendar,
      label: "Date",
      value: date ? formatDate(date) : "—",
    },
    {
      icon: Clock,
      label: "Time",
      value: time ? formatTime(time) : "—",
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
        <CheckCircle2 className="w-10 h-10 text-green-400" />
      </div>

      <Badge variant="midnight" className="mb-4">
        Booking #{bookingRef}
      </Badge>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        You&apos;re All Set!
      </h1>
      <p className="text-midnight-400 text-lg mb-8">
        Your appointment has been requested. Complete your payment below to lock
        in the booking.
      </p>

      {/* Summary card */}
      <div className="bg-midnight-900 border border-midnight-800 rounded-xl p-6 mb-6 text-left space-y-3">
        {details.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-midnight-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gold-400" />
            </div>
            <div className="flex-1">
              <p className="text-midnight-500 text-xs uppercase tracking-wider">
                {label}
              </p>
              <p className="text-white text-sm font-medium">{value}</p>
            </div>
          </div>
        ))}

        {price && (
          <>
            <div className="border-t border-midnight-800 pt-3 flex items-center justify-between">
              <span className="text-midnight-400 text-sm">Total Due</span>
              <span className="text-gold-400 font-bold text-xl">
                {formatCurrency(Number(price))}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Payment CTA */}
      <a href={squarePayLink} target="_blank" rel="noopener noreferrer" className="block mb-4">
        <Button variant="gold" size="xl" className="w-full group">
          <CreditCard className="w-5 h-5 mr-2" />
          Complete Payment via Square
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </a>

      <p className="text-midnight-500 text-xs mb-6">
        You will receive a confirmation email after payment. Payments are
        securely processed via Square.
      </p>

      <Link href="/">
        <Button
          variant="ghost"
          className="text-midnight-400 hover:text-white"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}

export default function ConfirmPage({ searchParams }: ConfirmPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <CheckCircle2 className="w-12 h-12 text-gold-400 animate-pulse" />
        </div>
      }
    >
      <ConfirmationContent searchParams={searchParams} />
    </Suspense>
  );
}
