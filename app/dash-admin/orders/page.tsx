"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"

type OrderItem = { id: string; name: string; quantity: number; unit_price: number; type: "service" | "product" }
type Order = {
  id: string; customer_name: string; customer_phone?: string; total: number; status: string
  created_at: string; items?: OrderItem[]; artist_names?: string[]
  accepted_at?: string; declined_at?: string; decline_reason?: string
}

const STATUSES = ["all", "pending", "accepted", "processing", "completed", "declined", "refunded"] as const

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  pending:    { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  accepted:   { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  processing: { bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  completed:  { bg: "rgba(34,197,94,0.1)",  text: "#22c55e", border: "rgba(34,197,94,0.25)" },
  declined:   { bg: "rgba(239,68,68,0.1)",  text: "#ef4444", border: "rgba(239,68,68,0.25)" },
  refunded:   { bg: "rgba(168,85,247,0.1)", text: "#a855f7", border: "rgba(168,85,247,0.25)" },
  cancelled:  { bg: "rgba(107,114,128,0.1)", text: "#6b7280", border: "rgba(107,114,128,0.25)" },
}

const TIMELINE_STEPS = ["pending", "accepted", "processing", "completed"]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modal state
  const [modal, setModal] = useState<{ type: "accept" | "decline"; orderId: string } | null>(null)
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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    STATUSES.forEach((s) => { if (s !== "all") counts[s] = orders.filter((o) => o.status === s).length })
    return counts
  }, [orders])

  const filtered = useMemo(() => {
    return filter === "all" ? orders : orders.filter((o) => o.status === filter)
  }, [orders, filter])

  const updateStatus = async (orderId: string, status: string) => {
    setActionLoading(orderId)
    try {
      const res = await fetch("/api/orders/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status }),
      })
      if (!res.ok) throw new Error("Failed")
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
      showToast(`Order marked as ${status}`)
    } catch { showToast("Failed to update status") }
    finally { setActionLoading(null) }
  }

  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/accept`, { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "accepted", accepted_at: new Date().toISOString() } : o))
      showToast("Order accepted")
      setModal(null)
    } catch { showToast("Failed to accept order") }
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
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "declined", declined_at: new Date().toISOString(), decline_reason: declineReason } : o))
      showToast("Order declined")
      setModal(null)
      setDeclineReason("")
    } catch { showToast("Failed to decline order") }
    finally { setActionLoading(null) }
  }

  const getTimelineIndex = (status: string) => {
    const idx = TIMELINE_STEPS.indexOf(status)
    return idx >= 0 ? idx : -1
  }

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>{toast}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Orders</h1>
          <p className="mt-1" style={{ color: "hsl(var(--text-secondary))" }}>Manage all customer orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8a6 6 0 0110.9-3.5M14 8a6 6 0 01-10.9 3.5"/><path d="M14 2v4h-4M2 14v-4h4"/></svg>
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Orders", value: orders.length, color: "var(--accent-hex)" },
          { label: "Pending", value: statusCounts.pending || 0, color: "#f59e0b" },
          { label: "Processing", value: (statusCounts.accepted || 0) + (statusCounts.processing || 0), color: "#3b82f6" },
          { label: "Completed", value: statusCounts.completed || 0, color: "#22c55e" },
        ].map((s) => (
          <div key={s.label} className="card-glass p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-full text-xs font-semibold capitalize transition-all ${filter === s ? "gradient-accent text-white" : ""}`}
            style={filter !== s ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}
          >
            {s} {!loading && <span className="ml-1 opacity-70">({statusCounts[s] || 0})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                {["Order ID", "Customer", "Artist(s)", "Total", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ background: "var(--surface-2-hex)", width: `${50 + Math.random() * 40}%` }} />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color: "hsl(var(--text-muted))" }}>No orders found</td></tr>
              ) : (
                filtered.map((order) => {
                  const sc = statusColor[order.status] || statusColor.cancelled
                  const isExpanded = expandedId === order.id
                  return (
                    <tr key={order.id} style={{ borderBottom: isExpanded ? "none" : "1px solid var(--glass-border)" }}>
                      <td colSpan={7} className="p-0">
                        {/* Main row */}
                        <div
                          className="flex items-center cursor-pointer transition-colors px-4 py-3"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--glass-bg)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <div className="flex-1 grid grid-cols-7 items-center gap-2" style={{ minWidth: 0 }}>
                            <span className="font-mono text-xs" style={{ color: "var(--accent-hex)" }}>#{order.id.slice(0, 8)}</span>
                            <span className="truncate" style={{ color: "hsl(var(--text-primary))" }}>{order.customer_name || "—"}</span>
                            <span className="truncate text-xs" style={{ color: "hsl(var(--text-secondary))" }}>{order.artist_names?.join(", ") || "—"}</span>
                            <span className="font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{order.total?.toFixed(2) || "0.00"}</span>
                            <span>
                              <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full" style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}>
                                {order.status}
                              </span>
                            </span>
                            <span className="text-xs" style={{ color: "hsl(var(--text-secondary))" }}>
                              {order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                            </span>
                            <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={order.status}
                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                disabled={actionLoading === order.id}
                                className="px-2 py-1 rounded-lg text-xs"
                                style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                              >
                                {STATUSES.filter((s) => s !== "all").map((s) => (
                                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                              </select>
                              <svg
                                width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5" strokeLinecap="round"
                                style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                              >
                                <path d="M4 6l4 4 4-4" />
                              </svg>
                            </span>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="px-4 pb-4 animate-fade-in" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                            <div className="rounded-xl p-5 space-y-5" style={{ background: "var(--surface-2-hex)", border: "1px solid var(--glass-border)" }}>
                              {/* Customer info */}
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--text-muted))" }}>Customer</p>
                                  <p className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{order.customer_name || "—"}</p>
                                  {order.customer_phone && <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-secondary))" }}>{order.customer_phone}</p>}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--text-muted))" }}>Order Total</p>
                                  <p className="text-xl font-bold" style={{ color: "var(--accent-hex)" }}>&pound;{order.total?.toFixed(2) || "0.00"}</p>
                                </div>
                              </div>

                              {/* Items breakdown */}
                              {order.items && order.items.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--text-muted))" }}>Items</p>
                                  <div className="space-y-1.5">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold uppercase" style={{
                                            color: item.type === "service" ? "#8b5cf6" : "#3b82f6",
                                            background: item.type === "service" ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)",
                                          }}>
                                            {item.type}
                                          </span>
                                          <span style={{ color: "hsl(var(--text-primary))" }}>{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>x{item.quantity}</span>
                                          <span className="font-semibold" style={{ color: "var(--accent-hex)" }}>&pound;{(item.unit_price * item.quantity).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Status timeline */}
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--text-muted))" }}>Status Timeline</p>
                                <div className="flex items-center gap-2">
                                  {TIMELINE_STEPS.map((step, i) => {
                                    const currentIdx = getTimelineIndex(order.status)
                                    const isActive = i <= currentIdx
                                    const isDeclined = order.status === "declined" || order.status === "refunded" || order.status === "cancelled"
                                    const dotActive = !isDeclined && isActive
                                    return (
                                      <div key={step} className="flex items-center gap-2 flex-1">
                                        <div className="flex flex-col items-center">
                                          <div className="w-3 h-3 rounded-full" style={{
                                            background: dotActive ? "#22c55e" : isDeclined && i === 0 ? "#ef4444" : "var(--glass-border)",
                                          }} />
                                          <span className="text-[10px] mt-1 capitalize" style={{ color: dotActive ? "#22c55e" : "hsl(var(--text-muted))" }}>{step}</span>
                                        </div>
                                        {i < TIMELINE_STEPS.length - 1 && (
                                          <div className="flex-1 h-0.5 rounded" style={{ background: dotActive && i < currentIdx ? "#22c55e" : "var(--glass-border)" }} />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                {order.decline_reason && (
                                  <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    Decline reason: {order.decline_reason}
                                  </p>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
                                {order.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() => setModal({ type: "accept", orderId: order.id })}
                                      disabled={actionLoading === order.id}
                                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
                                      style={{ background: "#22c55e" }}
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => { setDeclineReason(""); setModal({ type: "decline", orderId: order.id }) }}
                                      disabled={actionLoading === order.id}
                                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
                                      style={{ background: "#ef4444" }}
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                                {order.status === "accepted" && (
                                  <button
                                    onClick={() => updateStatus(order.id, "processing")}
                                    disabled={actionLoading === order.id}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
                                    style={{ background: "#3b82f6" }}
                                  >
                                    Mark as Processing
                                  </button>
                                )}
                                {order.status === "processing" && (
                                  <button
                                    onClick={() => updateStatus(order.id, "completed")}
                                    disabled={actionLoading === order.id}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
                                    style={{ background: "#22c55e" }}
                                  >
                                    Mark as Complete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accept / Decline Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm card-glass p-6 animate-scale-in" style={{ background: "var(--surface-hex)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-primary))" }}>
                {modal.type === "accept" ? "Accept Order" : "Decline Order"}
              </h2>
              <button onClick={() => setModal(null)} className="p-1" style={{ color: "hsl(var(--text-muted))" }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              </button>
            </div>

            {modal.type === "accept" ? (
              <p className="text-sm mb-6" style={{ color: "hsl(var(--text-secondary))" }}>
                Are you sure you want to accept order <span className="font-mono" style={{ color: "var(--accent-hex)" }}>#{modal.orderId.slice(0, 8)}</span>?
              </p>
            ) : (
              <div className="mb-6">
                <p className="text-sm mb-3" style={{ color: "hsl(var(--text-secondary))" }}>
                  Decline order <span className="font-mono" style={{ color: "var(--accent-hex)" }}>#{modal.orderId.slice(0, 8)}</span>?
                </p>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Reason (optional)</label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Enter reason for declining..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              {modal.type === "accept" ? (
                <button
                  onClick={() => handleAccept(modal.orderId)}
                  disabled={actionLoading === modal.orderId}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: "#22c55e" }}
                >
                  {actionLoading === modal.orderId ? "Accepting..." : "Confirm Accept"}
                </button>
              ) : (
                <button
                  onClick={() => handleDecline(modal.orderId)}
                  disabled={actionLoading === modal.orderId}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: "#ef4444" }}
                >
                  {actionLoading === modal.orderId ? "Declining..." : "Confirm Decline"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
