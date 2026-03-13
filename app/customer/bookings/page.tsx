'use client';

import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, ExternalLink, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  service_name?: string;
  package_name?: string;
  artist_name?: string;
  booking_date?: string;
  booking_time?: string;
  status?: string;
  payment_link?: string;
  total?: number;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const CANCELLABLE = ['pending', 'confirmed'];

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch('/api/bookings/get-customer-bookings');
        if (!res.ok) throw new Error('Failed to load bookings');
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = useMemo(
    () => bookings.filter((b) => b.booking_date && b.booking_date >= today && b.status !== 'cancelled'),
    [bookings, today]
  );
  const past = useMemo(
    () => bookings.filter((b) => !upcoming.includes(b)),
    [bookings, upcoming]
  );

  async function cancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return;
    setCancellingId(id);
    try {
      const res = await fetch('/api/bookings/update-booking-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Failed to cancel');
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  function BookingCard({ booking }: { booking: Booking }) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#c9a84c]/20 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              {/* Date block */}
              <div className="text-center bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-3 py-2 shrink-0">
                <p className="text-xs font-bold text-[#c9a84c] uppercase">
                  {booking.booking_date
                    ? new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en', { month: 'short' })
                    : '—'}
                </p>
                <p className="text-2xl font-bold text-white leading-tight">
                  {booking.booking_date
                    ? new Date(booking.booking_date + 'T12:00:00').getDate()
                    : '—'}
                </p>
                {booking.booking_time && (
                  <p className="text-[10px] text-[#a0a0a0] mt-0.5">{booking.booking_time}</p>
                )}
              </div>

              <div>
                <p className="text-base font-semibold text-white">
                  {booking.package_name || booking.service_name || 'Service'}
                </p>
                <p className="text-sm text-[#a0a0a0] mt-0.5">
                  with {booking.artist_name || 'Artist TBD'}
                </p>
                {booking.total != null && (
                  <p className="text-sm text-[#c9a84c] font-medium mt-1">
                    ${booking.total.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge
                variant="outline"
                className={`text-xs ${statusColors[booking.status || ''] || 'text-[#a0a0a0] border-[#2a2a2a]'}`}
              >
                {booking.status || 'unknown'}
              </Badge>
              {booking.status === 'pending' && booking.payment_link && (
                <a
                  href={booking.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#c9a84c] hover:underline"
                >
                  Pay Now <ExternalLink size={11} />
                </a>
              )}
              {CANCELLABLE.includes(booking.status || '') && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={cancellingId === booking.id}
                  onClick={() => cancelBooking(booking.id)}
                  className="h-7 px-2 text-xs text-[#a0a0a0] hover:text-red-400 hover:bg-red-400/10"
                >
                  {cancellingId === booking.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    'Cancel'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">My Bookings</h2>
        <p className="text-[#a0a0a0] text-sm mt-1">{bookings.length} total bookings</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] p-1 rounded-lg">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#c9a84c] data-[state=active]:text-black text-[#a0a0a0]">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-[#c9a84c] data-[state=active]:text-black text-[#a0a0a0]">
            Past ({past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays size={48} className="text-[#2a2a2a] mb-4" />
              <p className="text-white font-medium mb-1">No upcoming bookings</p>
              <p className="text-[#a0a0a0] text-sm">Browse services to book your next appointment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : past.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays size={48} className="text-[#2a2a2a] mb-4" />
              <p className="text-white font-medium mb-1">No past bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {past.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
