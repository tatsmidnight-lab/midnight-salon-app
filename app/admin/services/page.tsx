'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Loader2, Sparkles } from 'lucide-react';

interface Service {
  id: string;
  name?: string;
  category?: string;
  artist_name?: string;
  price?: number;
  status?: string;
  description?: string;
}

interface BulkResult {
  name: string;
  description: string;
  price: number;
  category: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  inactive: 'bg-red-500/10 text-red-400 border-red-500/20',
  draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const CATEGORIES = ['Hair', 'Nails', 'Skin', 'Makeup', 'Lashes', 'Brows', 'Massage', 'Other'];

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', status: '', description: '' });
  const [editSaving, setEditSaving] = useState(false);

  // Bulk AI create
  const [bulkForm, setBulkForm] = useState({
    category: '',
    artist: '',
    count: '5',
    styleDescription: '',
  });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [bulkError, setBulkError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    try {
      const res = await fetch('/api/services/get-all-services');
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      setServices(data.services || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(svc: Service) {
    setEditTarget(svc);
    setEditForm({
      name: svc.name || '',
      price: String(svc.price ?? ''),
      status: svc.status || 'active',
      description: svc.description || '',
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/services/update-service`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          name: editForm.name,
          price: parseFloat(editForm.price),
          status: editForm.status,
          description: editForm.description,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setServices((prev) =>
        prev.map((s) =>
          s.id === editTarget.id
            ? { ...s, name: editForm.name, price: parseFloat(editForm.price), status: editForm.status, description: editForm.description }
            : s
        )
      );
      setEditOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm('Delete this service?')) return;
    try {
      const res = await fetch(`/api/services/delete-service`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    setBulkLoading(true);
    setBulkResults([]);
    setBulkError('');
    try {
      const res = await fetch('/api/services/admin-bulk-create-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: bulkForm.category,
          artist: bulkForm.artist,
          count: parseInt(bulkForm.count),
          styleDescription: bulkForm.styleDescription,
        }),
      });
      if (!res.ok) throw new Error('Bulk create failed');
      const data = await res.json();
      setBulkResults(data.services || []);
      fetchServices();
    } catch (err: any) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  }

  const byCategory = CATEGORIES.reduce<Record<string, Service[]>>((acc, cat) => {
    acc[cat] = services.filter((s) => s.category?.toLowerCase() === cat.toLowerCase());
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Service Management</h2>
          <p className="text-[#a0a0a0] text-sm mt-1">{services.length} services total</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] p-1 rounded-lg">
          <TabsTrigger value="all" className="data-[state=active]:bg-[#c9a84c] data-[state=active]:text-black text-[#a0a0a0]">
            All Services
          </TabsTrigger>
          <TabsTrigger value="category" className="data-[state=active]:bg-[#c9a84c] data-[state=active]:text-black text-[#a0a0a0]">
            By Category
          </TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-[#c9a84c] data-[state=active]:text-black text-[#a0a0a0]">
            Bulk AI Create
          </TabsTrigger>
        </TabsList>

        {/* All Services Tab */}
        <TabsContent value="all">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] mt-4">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-[#2a2a2a] rounded animate-pulse" />
                  ))}
                </div>
              ) : services.length === 0 ? (
                <p className="py-12 text-center text-[#a0a0a0] text-sm">No services found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2a2a2a] bg-[#0f0f0f]/40">
                        {['Name', 'Category', 'Artist', 'Price', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {services.map((svc) => (
                        <tr key={svc.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-white">{svc.name || '—'}</td>
                          <td className="px-6 py-4 text-sm text-[#a0a0a0]">{svc.category || '—'}</td>
                          <td className="px-6 py-4 text-sm text-[#a0a0a0]">{svc.artist_name || '—'}</td>
                          <td className="px-6 py-4 text-sm text-[#c9a84c] font-medium">
                            {svc.price != null ? `$${svc.price.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={`text-xs ${statusColors[svc.status || ''] || 'text-[#a0a0a0] border-[#2a2a2a]'}`}>
                              {svc.status || 'unknown'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEdit(svc)}
                                className="h-8 w-8 p-0 text-[#a0a0a0] hover:text-white hover:bg-white/10"
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteService(svc.id)}
                                className="h-8 w-8 p-0 text-[#a0a0a0] hover:text-red-400 hover:bg-red-400/10"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Category Tab */}
        <TabsContent value="category">
          <div className="mt-4 space-y-6">
            {CATEGORIES.filter((cat) => (byCategory[cat]?.length ?? 0) > 0).map((cat) => (
              <Card key={cat} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-[#c9a84c]">
                    {cat} <span className="text-[#a0a0a0] font-normal">({byCategory[cat].length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#2a2a2a]">
                    {byCategory[cat].map((svc) => (
                      <div key={svc.id} className="flex items-center justify-between px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{svc.name}</p>
                          <p className="text-xs text-[#a0a0a0]">{svc.artist_name || 'No artist'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-[#c9a84c] font-medium">
                            {svc.price != null ? `$${svc.price.toFixed(2)}` : '—'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(svc)}
                            className="h-7 px-2 text-[#a0a0a0] hover:text-white text-xs"
                          >
                            <Pencil size={13} className="mr-1" /> Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {CATEGORIES.every((cat) => (byCategory[cat]?.length ?? 0) === 0) && (
              <p className="text-center text-[#a0a0a0] text-sm py-12">No services to display</p>
            )}
          </div>
        </TabsContent>

        {/* Bulk AI Create Tab */}
        <TabsContent value="bulk">
          <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Sparkles size={18} className="text-[#c9a84c]" />
                  AI Bulk Create Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBulkCreate} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#a0a0a0] mb-1.5 block">Category</label>
                    <Select
                      value={bulkForm.category}
                      onValueChange={(v) => setBulkForm((f) => ({ ...f, category: v }))}
                    >
                      <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-white hover:bg-white/5">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-[#a0a0a0] mb-1.5 block">Artist Name</label>
                    <Input
                      placeholder="e.g. Sarah, or leave blank"
                      value={bulkForm.artist}
                      onChange={(e) => setBulkForm((f) => ({ ...f, artist: e.target.value }))}
                      className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#a0a0a0] mb-1.5 block">
                      Number of Services (1–20)
                    </label>
                    <Select
                      value={bulkForm.count}
                      onValueChange={(v) => setBulkForm((f) => ({ ...f, count: v }))}
                    >
                      <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)} className="text-white hover:bg-white/5">
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-[#a0a0a0] mb-1.5 block">Style Description</label>
                    <textarea
                      value={bulkForm.styleDescription}
                      onChange={(e) => setBulkForm((f) => ({ ...f, styleDescription: e.target.value }))}
                      placeholder="Describe the vibe, target audience, pricing tier…"
                      rows={4}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#a0a0a0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 resize-none"
                    />
                  </div>

                  {bulkError && (
                    <p className="text-red-400 text-sm">{bulkError}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={bulkLoading || !bulkForm.category}
                    className="w-full bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black font-semibold gap-2"
                  >
                    {bulkLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate Services
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            {(bulkLoading || bulkResults.length > 0) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider">
                  Generated Services
                </h3>
                {bulkLoading && (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg animate-pulse" />
                    ))}
                  </div>
                )}
                {bulkResults.map((r, i) => (
                  <Card key={i} className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{r.name}</p>
                          <p className="text-xs text-[#a0a0a0] mt-1">{r.description}</p>
                        </div>
                        <span className="text-sm font-bold text-[#c9a84c] shrink-0">
                          ${r.price?.toFixed(2)}
                        </span>
                      </div>
                      <Badge variant="outline" className="mt-2 text-xs border-[#2a2a2a] text-[#a0a0a0]">
                        {r.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-[#a0a0a0] mb-1.5 block">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#a0a0a0] mb-1.5 block">Price ($)</label>
              <Input
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#a0a0a0] mb-1.5 block">Status</label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  {['active', 'inactive', 'draft'].map((s) => (
                    <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[#a0a0a0] mb-1.5 block">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditOpen(false)}
              className="text-[#a0a0a0] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={editSaving}
              className="bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black font-semibold"
            >
              {editSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
