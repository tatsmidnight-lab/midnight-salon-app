"use client"

import { useEffect, useState, useRef } from "react"

type User = {
  id: string
  display_name: string
  phone: string
  email: string
  role: string
  avatar_url: string | null
  created_at: string
  is_active: boolean
}

const ROLES = ["customer", "artist", "admin"] as const

const roleColor = (r: string) => {
  if (r === "admin") return "#ef4444"
  if (r === "artist") return "#8b5cf6"
  return "var(--accent-hex)"
}

const roleIcon = (r: string) => {
  if (r === "admin") return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l2 4 4.5.7-3.3 3.1.8 4.5L8 11.3 3.9 13.3l.8-4.5L1.5 5.7 6 5z"/></svg>
  )
  if (r === "artist") return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M3 15c0-3 2-5 5-5s5 2 5 5"/><path d="M12 3l2 2"/></svg>
  )
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="6" r="3"/><path d="M3 15c0-3 2-5 5-5s5 2 5 5"/></svg>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ display_name: "", email: "", role: "" })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [bulkRole, setBulkRole] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = () => {
    setLoading(true)
    fetch("/api/admin/users")
      .then((r) => r.ok ? r.json() : { users: [] })
      .then((data) => setUsers(Array.isArray(data.users) ? data.users : Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const changeRole = async (userId: string, role: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role }),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
        showToast(`Role updated to ${role}`)
      }
    } catch {}
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setEditForm({
      display_name: user.display_name || "",
      email: user.email || "",
      role: user.role,
    })
  }

  const saveEdit = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editUser.id, ...editForm }),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, ...editForm } : u))
        setEditUser(null)
        showToast("User updated")
      }
    } catch {} finally { setSaving(false) }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!editUser) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("user_id", editUser.id)
      const res = await fetch("/api/admin/users/upload-avatar", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        const avatarUrl = data.avatar_url || data.url
        setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, avatar_url: avatarUrl } : u))
        setEditUser((prev) => prev ? { ...prev, avatar_url: avatarUrl } : null)
        showToast("Avatar uploaded")
      }
    } catch {} finally { setUploading(false) }
  }

  const handleBulkRoleChange = async () => {
    if (!bulkRole || selectedUsers.size === 0) return
    const promises = Array.from(selectedUsers).map((id) =>
      fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: bulkRole }),
      })
    )
    await Promise.all(promises)
    setUsers((prev) => prev.map((u) => selectedUsers.has(u.id) ? { ...u, role: bulkRole } : u))
    setSelectedUsers(new Set())
    setBulkRole("")
    showToast(`${selectedUsers.size} users updated to ${bulkRole}`)
  }

  const toggleSelect = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === filtered.length) setSelectedUsers(new Set())
    else setSelectedUsers(new Set(filtered.map((u) => u.id)))
  }

  const filtered = users.filter((u) => {
    const matchesSearch = search === "" ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    artists: users.filter((u) => u.role === "artist").length,
    customers: users.filter((u) => u.role === "customer").length,
  }

  return (
    <div className="p-6 lg:p-8 animate-page-enter">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>Users</h1>
          <p className="mt-1" style={{ color: "hsl(var(--text-secondary))" }}>Manage roles, profiles & permissions</p>
        </div>
        <button onClick={fetchUsers} className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8a6 6 0 0110.9-3.5M14 8a6 6 0 01-10.9 3.5"/><path d="M14 2v4h-4M2 14v-4h4"/></svg>
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Users", value: stats.total, color: "var(--accent-hex)" },
          { label: "Admins", value: stats.admins, color: "#ef4444" },
          { label: "Artists", value: stats.artists, color: "#8b5cf6" },
          { label: "Customers", value: stats.customers, color: "var(--accent-hex)" },
        ].map((s) => (
          <div key={s.label} className="card-glass p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
          />
        </div>
        <div className="flex gap-1.5">
          {["all", ...ROLES].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-full text-xs font-semibold capitalize transition-all ${roleFilter === r ? "gradient-accent text-white" : ""}`}
              style={roleFilter !== r ? { background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--text-secondary))" } : undefined}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedUsers.size > 0 && (
        <div className="card-glass p-3 mb-4 flex items-center gap-3 animate-fade-in">
          <span className="text-xs font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
            {selectedUsers.size} selected
          </span>
          <select
            value={bulkRole}
            onChange={(e) => setBulkRole(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
          >
            <option value="">Change role to...</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={handleBulkRoleChange} disabled={!bulkRole} className="btn-primary !py-1.5 !px-4 text-xs disabled:opacity-40">
            Apply
          </button>
          <button onClick={() => setSelectedUsers(new Set())} className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedUsers.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                    style={{ accentColor: "var(--accent-hex)" }}
                  />
                </th>
                {["User", "Phone", "Email", "Role", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--text-muted))" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ background: "var(--surface-2-hex)", width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color: "hsl(var(--text-muted))" }}>
                  {search ? "No users match your search" : "No users found"}
                </td></tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="group transition-colors" style={{ borderBottom: "1px solid var(--glass-border)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--glass-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        style={{ accentColor: "var(--accent-hex)" }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${roleColor(user.role)}, ${roleColor(user.role)}88)` }}
                        >
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (user.display_name || "?")[0].toUpperCase()
                          )}
                        </div>
                        <span className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
                          {user.display_name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "hsl(var(--text-secondary))" }}>{user.phone || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(var(--text-secondary))" }}>{user.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-full" style={{ color: roleColor(user.role), background: `${roleColor(user.role)}15` }}>
                        {roleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }} title="Edit user">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="hsl(var(--text-secondary))" strokeWidth="1.5" strokeLinecap="round"><path d="M11.5 1.5l3 3L5 14H2v-3z"/></svg>
                        </button>
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user.id, e.target.value)}
                          className="px-2 py-1 rounded-lg text-xs"
                          style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)} />
          <div className="relative w-full max-w-md card-glass p-6 animate-scale-in" style={{ background: "var(--surface-hex)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-primary))" }}>Edit User</h2>
              <button onClick={() => setEditUser(null)} className="p-1" style={{ color: "hsl(var(--text-muted))" }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden cursor-pointer relative group"
                style={{ background: `linear-gradient(135deg, ${roleColor(editUser.role)}, ${roleColor(editUser.role)}88)` }}
                onClick={() => fileInputRef.current?.click()}
              >
                {editUser.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (editUser.display_name || "?")[0].toUpperCase()
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  {uploading ? (
                    <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" strokeDasharray="30" strokeDashoffset="10"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M8 10V3M5 5l3-3 3 3"/><path d="M2 11v2a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAvatarUpload(file)
                }}
              />
              <p className="text-xs mt-2" style={{ color: "hsl(var(--text-muted))" }}>Click to upload avatar</p>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Display Name</label>
                <input
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Role</label>
                <div className="flex gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setEditForm({ ...editForm, role: r })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${editForm.role === r ? "text-white" : ""}`}
                      style={editForm.role === r
                        ? { background: roleColor(r) }
                        : { background: "var(--surface-2-hex)", color: "hsl(var(--text-secondary))", border: "1px solid var(--glass-border)" }
                      }
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Phone (read-only) */}
            <div className="mt-3">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--text-secondary))" }}>Phone (read-only)</label>
              <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-muted))", border: "1px solid var(--glass-border)" }}>
                {editUser.phone || "—"}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditUser(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 text-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
