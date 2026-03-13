"use client"

import { useEffect, useState } from "react"

type Order = {
  id: string; customer_name: string; total: number; status: string
  created_at: string; items?: { name: string; quantity: number }[]
}

export default function ArtistOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/orders/get-artist-orders")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter)

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await fetch("/api/orders/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status }),
      })
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    } catch {}
  }

  const statusColor = (s: string) => {
    if (s === "completed" || s === "delivered") return "#22c55e"
    if (s === "processing") return "#3b82f6"
    if (s === "pending") return "var(--accent-hex)"
    return "hsl(var(--text-muted))"
  }

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>Orders</h1>
      <p className="mb-8" style={{ color: "hsl(var(--text-secondary))" }}>Manage customer orders</p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "processing", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all ${filter === f ? "gradient-accent text-white" : ""}`}
            style={filter !== f ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-glass p-5 animate-pulse">
              <div className="h-4 w-1/3 rounded mb-2" style={{ background: "var(--surface-2-hex)" }} />
              <div className="h-3 w-1/4 rounded" style={{ background: "var(--surface-2-hex)" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "hsl(var(--text-muted))" }}>No orders</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filtered.map((order) => (
            <div key={order.id} className="card-glass p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold" style={{ color: "hsl(var(--text-primary))" }}>
                    {order.customer_name || `Order #${order.id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
                    {new Date(order.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{order.total}</p>
                  <span className="text-xs font-bold uppercase" style={{ color: statusColor(order.status) }}>
                    {order.status}
                  </span>
                </div>
              </div>
              {order.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateStatus(order.id, "processing")} className="btn-primary !py-2 !px-4 text-xs">
                    Start Processing
                  </button>
                </div>
              )}
              {order.status === "processing" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateStatus(order.id, "completed")} className="btn-primary !py-2 !px-4 text-xs">
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
