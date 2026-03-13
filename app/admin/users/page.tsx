'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCheck, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  display_name?: string;
  phone?: string;
  email?: string;
  role?: string;
  created_at?: string;
}

const roleColors: Record<string, string> = {
  admin: 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30',
  artist: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  customer: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [promoting, setPromoting] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function promoteToArtist(userId: string) {
    setPromoting(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: 'artist' }),
      });
      if (!res.ok) throw new Error('Promotion failed');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: 'artist' } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to promote user');
    } finally {
      setPromoting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-[#a0a0a0] text-sm mt-1">
            {users.length} total users
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
          className="border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:border-[#c9a84c] gap-2"
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

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
            <Input
              placeholder="Search by name, phone, or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0] focus-visible:ring-[#c9a84c]/30"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-[#2a2a2a] rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[#a0a0a0] text-sm">
              {search ? 'No users match your search.' : 'No users found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a] bg-[#0f0f0f]/40">
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider hidden lg:table-cell">
                      Joined
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] text-sm font-bold shrink-0">
                            {(user.display_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {user.display_name || 'Unnamed'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a0a0a0]">
                        {user.phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a0a0a0] hidden md:table-cell">
                        {user.email || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${roleColors[user.role || ''] || 'text-[#a0a0a0] border-[#2a2a2a]'}`}
                        >
                          {user.role || 'unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a0a0a0] hidden lg:table-cell">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role === 'customer' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={promoting === user.id}
                            onClick={() => promoteToArtist(user.id)}
                            className="border-[#2a2a2a] text-[#a0a0a0] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 gap-1.5 text-xs"
                          >
                            {promoting === user.id ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                Promoting…
                              </>
                            ) : (
                              <>
                                <UserCheck size={13} />
                                Promote to Artist
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
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
