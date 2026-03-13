'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
}

interface Order {
  id: string;
  created_at?: string;
  total?: number;
  status?: string;
  items?: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  processing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders/get-customer-orders');
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Order History</h2>
        <p className="text-[#a0a0a0] text-sm mt-1">{orders.length} orders</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag size={48} className="text-[#2a2a2a] mb-4" />
          <p className="text-white font-medium mb-1">No orders yet</p>
          <p className="text-[#a0a0a0] text-sm">Visit the shop to place your first order</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const itemSummary = order.items
              ? order.items.map((i) => i.product_name).filter(Boolean).slice(0, 2).join(', ')
              : '';
            const moreCount = (order.items?.length || 0) - 2;
            return (
              <Card
                key={order.id}
                className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#c9a84c]/20 transition-colors overflow-hidden"
              >
                <CardContent className="p-0">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center shrink-0">
                        <ShoppingBag size={18} className="text-[#c9a84c]" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
                              : '—'}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusColors[order.status || ''] || 'text-[#a0a0a0] border-[#2a2a2a]'}`}
                          >
                            {order.status || 'unknown'}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#a0a0a0] mt-0.5 truncate max-w-xs">
                          {itemSummary || 'No items'}
                          {moreCount > 0 && ` +${moreCount} more`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base font-bold text-white">
                        ${(order.total || 0).toFixed(2)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-[#a0a0a0]" />
                      ) : (
                        <ChevronDown size={16} className="text-[#a0a0a0]" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#2a2a2a] px-5 py-4 bg-[#0f0f0f]/30">
                      {!order.items || order.items.length === 0 ? (
                        <p className="text-sm text-[#a0a0a0] italic">No item details available</p>
                      ) : (
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-white">{item.product_name || 'Product'}</p>
                                <p className="text-xs text-[#a0a0a0]">× {item.quantity}</p>
                              </div>
                              <span className="text-sm font-medium text-[#c9a84c]">
                                ${((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-[#2a2a2a] flex justify-between">
                            <span className="text-sm font-semibold text-white">Total</span>
                            <span className="text-sm font-bold text-white">${(order.total || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
