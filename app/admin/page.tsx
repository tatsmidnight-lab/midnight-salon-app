'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign, Users, ShoppingBag, TrendingUp } from 'lucide-react';

interface Booking {
  id: string;
  customer_name?: string;
  service_name?: string;
  booking_date?: string;
  status?: string;
  total?: number;
}

interface Order {
  id: string;
  customer_name?: string;
  created_at?: string;
  total?: number;
  status?: string;
  items_count?: number;
}

interface Stats {
  bookingsToday: number;
  revenueMonth: number;
  activeArtists: number;
  pendingOrders: number;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  loading: boolean;
}) {
  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-[#a0a0a0] mb-1">{title}</p>
            {loading ? (
              <div className="h-8 w-20 bg-[#2a2a2a] rounded animate-pulse mt-1" />
            ) : (
              <p className="text-3xl font-bold text-white">{value}</p>
            )}
            {trend && (
              <p className="text-xs text-[#a0a0a0] mt-1 flex items-center gap-1">
                <TrendingUp size={12} className="text-[#c9a84c]" />
                {trend}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
            <Icon size={22} className="text-[#c9a84c]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-[#2a2a2a] rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats>({
    bookingsToday: 0,
    revenueMonth: 0,
    activeArtists: 0,
    pendingOrders: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [bookingsRes, ordersRes] = await Promise.all([
          fetch('/api/bookings/get-customer-bookings'),
          fetch('/api/orders/admin-get-all-orders'),
        ]);

        const bookingsData = bookingsRes.ok ? await bookingsRes.json() : { bookings: [] };
        const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };

        const bookings: Booking[] = bookingsData.bookings || [];
        const orders: Order[] = ordersData.orders || [];

        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(
          (b) => b.booking_date && b.booking_date.startsWith(today)
        );

        const thisMonth = new Date().toISOString().slice(0, 7);
        const monthRevenue = orders
          .filter((o) => o.created_at?.startsWith(thisMonth) && o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total || 0), 0);

        const pendingOrders = orders.filter((o) => o.status === 'pending').length;

        setStats({
          bookingsToday: todayBookings.length,
          revenueMonth: monthRevenue,
          activeArtists: 0,
          pendingOrders,
        });

        setRecentBookings(bookings.slice(0, 5));
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-[#a0a0a0] text-sm mt-1">Overview of your salon operations</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Bookings Today"
          value={stats.bookingsToday}
          icon={CalendarDays}
          trend="vs yesterday"
          loading={loading}
        />
        <StatCard
          title="Revenue This Month"
          value={`$${stats.revenueMonth.toFixed(2)}`}
          icon={DollarSign}
          trend="vs last month"
          loading={loading}
        />
        <StatCard
          title="Active Artists"
          value={stats.activeArtists}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={ShoppingBag}
          loading={loading}
        />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-semibold">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : recentBookings.length === 0 ? (
              <p className="text-[#a0a0a0] text-sm py-4 text-center">No bookings found</p>
            ) : (
              <div className="space-y-0 divide-y divide-[#2a2a2a]">
                {recentBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {b.customer_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-[#a0a0a0] truncate">
                        {b.service_name || '—'} · {b.booking_date?.slice(0, 10) || '—'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ml-2 shrink-0 ${statusColors[b.status || ''] || 'text-[#a0a0a0] border-[#2a2a2a]'}`}
                    >
                      {b.status || 'unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-semibold">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : recentOrders.length === 0 ? (
              <p className="text-[#a0a0a0] text-sm py-4 text-center">No orders found</p>
            ) : (
              <div className="space-y-0 divide-y divide-[#2a2a2a]">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {o.customer_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-[#a0a0a0]">
                        {o.items_count ?? 0} item{o.items_count !== 1 ? 's' : ''} ·{' '}
                        {o.created_at?.slice(0, 10) || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-sm font-semibold text-[#c9a84c]">
                        ${(o.total || 0).toFixed(2)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[o.status || ''] || 'text-[#a0a0a0] border-[#2a2a2a]'}`}
                      >
                        {o.status || 'unknown'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
