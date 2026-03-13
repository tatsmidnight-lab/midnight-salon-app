"use client"

import { useEffect, useState, useMemo } from "react"

type OrderItem = { id: string; name: string; quantity: number; unit_price: number; type: "service" | "product" }
type Order = {
  id: string; customer_name: string; customer_phone?: string; total: number; status: string
  created_at: string; items?: OrderItem[]; artist_names?: string[]
  accepted_at?: string; declined_at?: string; decline_reason?: string
  coupon_code?: string; discount_amount?: number
}

const STATUSES = ["all", "pending", "accepted", "processing", "completed", "declined", "cancelled", "refunded"] as const

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  pending:    { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.3)", icon: "⏳" },
  accepted:   { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.3)", icon: "✓" },
  processing: { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6", border: "rgba(139,92,246,0.3)", icon: "⚙" },
  completed:  { bg: "rgba(34,197,94,0.12)",  text: "#22c55e", border: "rgba(34,197,94,0.3)",  icon: "✓✓" },
  declined:   { bg: "rgba(239,68,68,0.12)",  text: "#ef4444", border: "rgba(239,68,68,0.3)",  icon: "✗" },
  cancelled:  { bg: "rgba(107,114,128,0.12)", text: "#6b7280", border: "rgba(107,114,128,0.3)", icon: "—" },
  refunded:   { bg: "rgba(168,85,247,0.12)", text: "#a855f7", border: "rgba(168,85,247,0.3)", icon: "↩" },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [declineModal, setDeclineModal] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = () => {
    setLoading(true)
    fetch("/api/orders/admin-get-all-orders")
      .then((r) => r.ok ? r.json() : { orders: [] })
      .then((data) => setOrders(Array.isArray(data) ? data : data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    STATUSES.forEach((s) => { if (s !== "all") counts[s] = orders.filter((o) => o.status === s).length })
    return counts
  }, [orders])

  const filtered = useMemo(() => {
    const list = filter === "all" ? orders : orders.filter((o) => o.status === filter)
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [orders, filter])

  const pendingOrders = useMemo(() => orders.filter(o => o.status === "pending"), [orders])

  // ─── One-click actions ───
  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/accept`, { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "accepted", accepted_at: new Date().toISOString() } : o))
      showToast("Order accepted ✓")
    } catch { showToast("Failed to accept", "error") }
    finally { setActionLoading(null) }
  }

  const handleDecline = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason }),
      })
      if (!res.ok) throw new Error("Failed")
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "declined", declined_at: new Date().toISOString(), decline_reason: declineReason } : o))
      showToast("Order declined")
      setDeclineModal(null)
      setDeclineReason("")
    } catch { showToast("Failed to decline", "error") }
    finally { setActionLoading(null) }
  }

  const updateStatus = async (orderId: string, status: string) => {
    setActionLoading(orderId)
    try {
      const res = await fetch("/api/orders/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status }),
      })
      if (!res.ok) throw new Error("Failed")
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      showToast(`Marked as ${status}`)
    } catch { showToast("Failed to update", "error") }
    finally { setActionLoading(null) }
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="p-4 lg:p-8 animate-page-enter">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl" style={{
            background: toast.type === "success" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #ef4444, #dc2626)"
          }}>{toast.msg}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Orders</h1>
          <p className="mt-1 text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
            {pendingOrders.length > 0 ? `${pendingOrders.length} pending order${pendingOrders.length > 1 ? "s" : ""} need attention` : "All caught up"}
          </p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8a6 6 0 0110.9-3.5M14 8a6 6 0 01-10.9 3.5"/><path d="M14 2v4h-4M2 14v-4h4"/></svg>
          Refresh
        </button>
      </div>

      {/* ═══ PENDING ORDERS — ACTION REQUIRED ═══ */}
      {pendingOrders.length > 0 && filter === "all" && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#f59e0b" }} />
            <h2 className="text-lg font-bold" style={{ color: "#f59e0b" }}>Action Required</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingOrders.map(order => {
              const isLoading = actionLoading === order.id
              return (
                <div key={order.id} className="card-glass p-5 relative overflow-hidden">
                  {/* Accent top line */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444)" }} />

                  {/* Order header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-base" style={{ color: "hsl(var(--text-primary))" }}>
                        {order.customer_name || "Walk-in"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                        {timeAgo(order.created_at)} &middot; #{order.id.slice(0, 6)}
                      </p>
                    </div>
                    <p className="text-xl font-bold" style={{ color: "var(--accent-hex)" }}>
                      &pound;{order.total?.toFixed(2)}
                    </p>
                  </div>

                  {/* Items preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4 space-y-1">
                      {order.items.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="truncate" style={{ color: "hsl(var(--text-secondary))" }}>
                            {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.name}
                          </span>
                          <span className="font-semibold ml-2" style={{ color: "hsl(var(--text-primary))" }}>
                            &pound;{(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>+{order.items.length - 3} more items</p>
                      )}
                    </div>
                  )}

                  {/* One-click action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={isLoading}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8l3 3 7-7"/></svg>
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { setDeclineReason(""); setDeclineModal(order.id) }}
                      disabled={isLoading}
                      className="py-3 px-4 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ STATS BAR ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: orders.length, color: "var(--accent-hex)", icon: "📦" },
          { label: "Pending", value: statusCounts.pending || 0, color: "#f59e0b", icon: "⏳" },
          { label: "Active", value: (statusCounts.accepted || 0) + (statusCounts.processing || 0), color: "#3b82f6", icon: "⚡" },
          { label: "Completed", value: statusCounts.completed || 0, color: "#22c55e", icon: "✓" },
        ].map((s) => (
          <div key={s.label} className="card-glass p-4 text-center cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setFilter(s.label === "Total" ? "all" : s.label === "Active" ? "accepted" : s.label.toLowerCase())}
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ═══ FILTER TABS ═══ */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-full text-xs font-semibold capitalize transition-all ${filter === s ? "gradient-accent text-white shadow-lg" : "hover:opacity-80"}`}
            style={filter !== s ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}
          >
            {s} {!loading && statusCounts[s] > 0 && <span className="ml-1 opacity-70">({statusCounts[s]})</span>}
          </button>
        ))}
      </div>

      {/* ═══ ORDERS LIST ═══ */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-glass p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: "var(--surface-2-hex)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded animate-pulse" style={{ background: "var(--surface-2-hex)", width: `${40 + Math.random() * 30}%` }} />
                  <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-2-hex)", width: `${30 + Math.random() * 20}%` }} />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>No orders found</p>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
              {filter !== "all" ? `No ${filter} orders` : "Orders will appear here"}
            </p>
          </div>
        ) : (
          filtered.map(order => {
            const sc = statusConfig[order.status] || statusConfig.cancelled
            const isLoading = actionLoading === order.id
            return (
              <div key={order.id} className="card-glass overflow-hidden transition-all hover:shadow-xl">
                <div className="p-5">
                  {/* Top row: customer + status + total */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {(order.customer_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
                          {order.customer_name || "Walk-in"}
                        </p>
                        <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                          {timeAgo(order.created_at)} &middot; <span className="font-mono">#{order.id.slice(0, 8)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{order.total?.toFixed(2)}</p>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {order.items.map(item => (
                        <span key={item.id} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-secondary))" }}>
                          {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Coupon */}
                  {order.coupon_code && (
                    <p className="text-xs mb-3" style={{ color: "#22c55e" }}>
                      Coupon: {order.coupon_code} (-&pound;{order.discount_amount?.toFixed(2)})
                    </p>
                  )}

                  {/* Decline reason */}
                  {order.decline_reason && (
                    <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                      Declined: {order.decline_reason}
                    </p>
                  )}

                  {/* Quick action buttons — contextual based on status */}
                  <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: "1px solid var(--glass-border)" }}>
                    {order.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAccept(order.id)}
                          disabled={isLoading}
                          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ background: "#22c55e" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3 3 7-7"/></svg>
                          Accept
                        </button>
                        <button
                          onClick={() => { setDeclineReason(""); setDeclineModal(order.id) }}
                          disabled={isLoading}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center gap-1.5"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                          Decline
                        </button>
                      </>
                    )}
                    {order.status === "accepted" && (
                      <button
                        onClick={() => updateStatus(order.id, "processing")}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center gap-1.5"
                        style={{ background: "#8b5cf6" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>
                        Start Processing
                      </button>
                    )}
                    {order.status === "processing" && (
                      <button
                        onClick={() => updateStatus(order.id, "completed")}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center gap-1.5"
                        style={{ background: "#22c55e" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3 3 7-7"/></svg>
                        Complete
                      </button>
                    )}
                    {(order.status === "completed" || order.status === "accepted" || order.status === "processing") && (
                      <button
                        onClick={() => updateStatus(order.id, "cancelled")}
                        disabled={isLoading}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
                        style={{ color: "hsl(var(--text-muted))" }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ═══ DECLINE MODAL ═══ */}
      {declineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeclineModal(null)} />
          <div className="relative w-full max-w-sm card-glass p-6 animate-scale-in" style={{ background: "var(--surface-hex)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-primary))" }}>Decline Order</h2>
              <button onClick={() => setDeclineModal(null)} className="p-1" style={{ color: "hsl(var(--text-muted))" }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "hsl(var(--text-secondary))" }}>
              Decline order <span className="font-mono font-bold" style={{ color: "var(--accent-hex)" }}>#{declineModal.slice(0, 6)}</span>? The customer will be notified.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason (optional)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
              style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
            />
            <div className="flex gap-3">
              <button onClick={() => setDeclineModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" }}>
                Cancel
              </button>
              <button
                onClick={() => handleDecline(declineModal)}
                disabled={actionLoading === declineModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: "#ef4444" }}
              >
                {actionLoading === declineModal ? "Declining..." : "Decline Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
