'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
}

interface Order {
  id: string;
  customer_name?: string;
  artist_name?: string;
  created_at?: string;
  total?: number;
  status?: string;
  items?: OrderItem[];
  items_count?: number;
}

const STATUS_OPTIONS = ['all', 'pending', 'processing', 'completed', 'cancelled'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  processing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [artistFilter, setArtistFilter] = useState('');

  async function fetchOrders() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/admin-get-all-orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOrders(); }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (dateFrom && o.created_at && o.created_at < dateFrom) return false;
      if (dateTo && o.created_at && o.created_at > dateTo + 'T23:59:59') return false;
      if (artistFilter && !o.artist_name?.toLowerCase().includes(artistFilter.toLowerCase())) return false;
      return true;
    });
  }, [orders, statusFilter, dateFrom, dateTo, artistFilter]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders/update-order-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function shortId(id: string) {
    return id.slice(0, 8).toUpperCase();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Orders</h2>
          <p className="text-[#a0a0a0] text-sm mt-1">{filtered.length} orders shown</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="border-[#2a2a2a] text-[#a0a0a0] hover:text-white gap-2"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#0f0f0f] border-[#2a2a2a] text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-[#0f0f0f] border-[#2a2a2a] text-white w-40"
          />
          <span className="text-[#a0a0a0] text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-[#0f0f0f] border-[#2a2a2a] text-white w-40"
          />
        </div>

        <Input
          placeholder="Filter by artist…"
          value={artistFilter}
          onChange={(e) => setArtistFilter(e.target.value)}
          className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0] w-44"
        />

        {(statusFilter !== 'all' || dateFrom || dateTo || artistFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); setArtistFilter(''); }}
            className="text-[#a0a0a0] hover:text-white"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-[#2a2a2a] rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-[#a0a0a0] text-sm">No orders match filters</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a] bg-[#0f0f0f]/40">
                    {['Order ID', 'Customer', 'Date', 'Total', 'Items', 'Status', 'Update Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <>
                      <tr
                        key={order.id}
                        className="border-b border-[#2a2a2a] hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      >
                        <td className="px-4 py-4 text-sm font-mono text-[#c9a84c]">
                          {shortId(order.id)}
                        </td>
                        <td className="px-4 py-4 text-sm text-white">
                          {order.customer_name || '—'}
                        </td>
                        <td className="px-4 py-4 text-sm text-[#a0a0a0]">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-white">
                          ${(order.total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-sm text-[#a0a0a0]">
                          {order.items_count ?? order.items?.length ?? 0}
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusColors[order.status || ''] || 'text-[#a0a0a0] border-[#2a2a2a]'}`}
                          >
                            {order.status || 'unknown'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={order.status || ''}
                            onValueChange={(v) => updateStatus(order.id, v)}
                            disabled={updatingId === order.id}
                          >
                            <SelectTrigger className="w-32 bg-[#0f0f0f] border-[#2a2a2a] text-white h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                              {['pending', 'processing', 'completed', 'cancelled'].map((s) => (
                                <SelectItem key={s} value={s} className="text-white text-xs capitalize">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-4 text-[#a0a0a0]">
                          {expandedId === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>

                      {/* Expanded items */}
                      {expandedId === order.id && (
                        <tr key={`${order.id}-expanded`} className="border-b border-[#2a2a2a] bg-[#0f0f0f]/30">
                          <td colSpan={8} className="px-4 py-4">
                            {!order.items || order.items.length === 0 ? (
                              <p className="text-sm text-[#a0a0a0] italic">No item details available</p>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-[#a0a0a0] uppercase tracking-wider mb-2">
                                  Order Items
                                </p>
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5"
                                  >
                                    <span className="text-sm text-white">{item.product_name || 'Unknown product'}</span>
                                    <div className="flex items-center gap-4">
                                      <span className="text-xs text-[#a0a0a0]">Qty: {item.quantity}</span>
                                      <span className="text-sm font-medium text-[#c9a84c]">
                                        ${((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
