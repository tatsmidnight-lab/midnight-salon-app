import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Scissors,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mic,
} from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Booking } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: AlertCircle,
    className: "text-yellow-400",
    badge: "outline" as const,
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "text-green-400",
    badge: "midnight" as const,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-blue-400",
    badge: "secondary" as const,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "text-red-400",
    badge: "destructive" as const,
  },
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/dashboard");

  // Fetch artist profile linked to this user
  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get display name from users table
  const { data: userProfile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const artistName = userProfile?.display_name || user.email?.split("@")[0];

  // Fetch bookings for this artist
  const artistId = artist?.id;
  const { data: bookings } = artistId
    ? await supabase
        .from("bookings")
        .select("*, services(name, price, duration)")
        .eq("artist_id", artistId)
        .order("date", { ascending: false })
        .limit(20)
    : { data: [] };

  // Fetch services count
  const { count: serviceCount } = artistId
    ? await supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("artist_id", artistId)
    : { count: 0 };

  const upcomingCount = (bookings ?? []).filter(
    (b: Booking) =>
      b.status === "confirmed" && new Date(`${b.date}T${b.time}`) > new Date()
  ).length;

  const totalRevenue = (bookings ?? [])
    .filter((b: Booking) => b.status === "completed")
    .reduce((sum: number, b: Booking & { services?: { price: number } }) => sum + (b.services?.price ?? 0), 0);

  const stats = [
    {
      label: "Total Bookings",
      value: bookings?.length ?? 0,
      icon: Calendar,
      color: "text-gold-400",
      bg: "bg-gold-500/10",
    },
    {
      label: "Upcoming",
      value: upcomingCount,
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Services Listed",
      value: serviceCount ?? 0,
      icon: Scissors,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Revenue",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {artistName}
          </h1>
          <p className="text-midnight-400">Here&apos;s an overview of your bookings and services.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/services/new">
            <Button variant="gold" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </Link>
          <Link href="/dashboard/services/new">
            <Button variant="outline" className="gap-2 border-midnight-700 text-midnight-300 hover:border-gold-500 hover:text-gold-400">
              <Mic className="w-4 h-4" />
              Voice Create
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-midnight-900 border border-midnight-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-midnight-400 text-sm">{stat.label}</span>
                <div
                  className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Bookings table */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Bookings</h2>
        <div className="bg-midnight-900 border border-midnight-800 rounded-xl overflow-hidden">
          {bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-midnight-800">
                    {["Date", "Time", "Service", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-midnight-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-midnight-800">
                  {bookings.map((booking: Booking & { services?: { name: string; price: number } }) => {
                    const cfg =
                      statusConfig[booking.status as keyof typeof statusConfig] ??
                      statusConfig.pending;
                    const StatusIcon = cfg.icon;
                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-midnight-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-white">
                          {formatDate(booking.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-midnight-300">
                          {formatTime(booking.time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-midnight-200">
                          {booking.services?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.className}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {booking.services?.price && (
                            <span className="text-sm text-gold-400 font-medium">
                              {formatCurrency(booking.services.price)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-midnight-700 mx-auto mb-3" />
              <p className="text-midnight-400">No bookings yet.</p>
              <p className="text-midnight-600 text-sm mt-1">
                Share your profile link to start receiving bookings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
