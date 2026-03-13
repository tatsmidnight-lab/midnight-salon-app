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
import { Plus, Pencil, Trash2, Upload, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name?: string;
  category?: string;
  price?: number;
  stock_qty?: number;
  status?: string;
  description?: string;
}

const CATEGORIES = ['Haircare', 'Skincare', 'Nailcare', 'Tools', 'Makeup', 'Fragrance', 'Other'];

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  inactive: 'bg-red-500/10 text-red-400 border-red-500/20',
  out_of_stock: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const emptyForm = {
  name: '',
  category: '',
  price: '',
  stock_qty: '',
  status: 'active',
  description: '',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addSaving, setAddSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSaving, setEditSaving] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/products/get-all-products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    try {
      const res = await fetch('/api/products/create-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          price: parseFloat(addForm.price),
          stock_qty: parseInt(addForm.stock_qty),
        }),
      });
      if (!res.ok) throw new Error('Failed to create product');
      const data = await res.json();
      setProducts((p) => [data.product, ...p]);
      setAddOpen(false);
      setAddForm(emptyForm);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddSaving(false);
    }
  }

  function openEdit(product: Product) {
    setEditTarget(product);
    setEditForm({
      name: product.name || '',
      category: product.category || '',
      price: String(product.price ?? ''),
      stock_qty: String(product.stock_qty ?? ''),
      status: product.status || 'active',
      description: product.description || '',
    });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/products/update-product', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          ...editForm,
          price: parseFloat(editForm.price),
          stock_qty: parseInt(editForm.stock_qty),
        }),
      });
      if (!res.ok) throw new Error('Failed to update product');
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editTarget.id
            ? { ...p, ...editForm, price: parseFloat(editForm.price), stock_qty: parseInt(editForm.stock_qty) }
            : p
        )
      );
      setEditOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch('/api/products/delete-product', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleBulkUpload() {
    setBulkError('');
    let parsed: any[];
    try {
      parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('Must be an array');
    } catch {
      setBulkError('Invalid JSON — must be an array of products');
      return;
    }
    setBulkSaving(true);
    try {
      const res = await fetch('/api/products/bulk-create-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsed }),
      });
      if (!res.ok) throw new Error('Bulk upload failed');
      setBulkOpen(false);
      setBulkJson('');
      fetchProducts();
    } catch (err: any) {
      setBulkError(err.message);
    } finally {
      setBulkSaving(false);
    }
  }

  const ProductFormFields = ({
    form,
    setForm,
  }: {
    form: typeof emptyForm;
    setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-[#a0a0a0] mb-1.5 block">Product Name</label>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
          />
        </div>
        <div>
          <label className="text-xs text-[#a0a0a0] mb-1.5 block">Category</label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-[#a0a0a0] mb-1.5 block">Status</label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              {['active', 'inactive', 'out_of_stock'].map((s) => (
                <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-[#a0a0a0] mb-1.5 block">Price ($)</label>
          <Input
            type="number"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
          />
        </div>
        <div>
          <label className="text-xs text-[#a0a0a0] mb-1.5 block">Stock Qty</label>
          <Input
            type="number"
            required
            value={form.stock_qty}
            onChange={(e) => setForm((f) => ({ ...f, stock_qty: e.target.value }))}
            className="bg-[#0f0f0f] border-[#2a2a2a] text-white"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-[#a0a0a0] mb-1.5 block">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Product Management</h2>
          <p className="text-[#a0a0a0] text-sm mt-1">{products.length} products</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:border-[#c9a84c] gap-2"
          >
            <Upload size={15} />
            Bulk Upload
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black font-semibold gap-2"
          >
            <Plus size={16} />
            Add Product
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-[#2a2a2a] rounded animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="py-12 text-center text-[#a0a0a0] text-sm">No products found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a] bg-[#0f0f0f]/40">
                    {['Name', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">{p.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-[#a0a0a0]">{p.category || '—'}</td>
                      <td className="px-6 py-4 text-sm text-[#c9a84c] font-medium">
                        {p.price != null ? `$${p.price.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        <span className={p.stock_qty === 0 ? 'text-red-400' : ''}>
                          {p.stock_qty ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`text-xs ${statusColors[p.status || ''] || 'text-[#a0a0a0] border-[#2a2a2a]'}`}>
                          {p.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="h-8 w-8 p-0 text-[#a0a0a0] hover:text-white hover:bg-white/10">
                            <Pencil size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="h-8 w-8 p-0 text-[#a0a0a0] hover:text-red-400 hover:bg-red-400/10">
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

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="py-2">
              <ProductFormFields form={addForm} setForm={setAddForm} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="text-[#a0a0a0]">
                Cancel
              </Button>
              <Button type="submit" disabled={addSaving} className="bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black font-semibold">
                {addSaving && <Loader2 size={16} className="animate-spin mr-2" />}
                Add Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="py-2">
              <ProductFormFields form={editForm} setForm={setEditForm} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="text-[#a0a0a0]">
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving} className="bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black font-semibold">
                {editSaving && <Loader2 size={16} className="animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Bulk Upload Products</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-xs text-[#a0a0a0]">
              Paste a JSON array of products. Each object should have: name, category, price, stock_qty, status.
            </p>
            <textarea
              value={bulkJson}
              onChange={(e) => { setBulkJson(e.target.value); setBulkError(''); }}
              placeholder='[{"name":"Argan Serum","category":"Haircare","price":24.99,"stock_qty":50,"status":"active"}]'
              rows={8}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-white font-mono placeholder:text-[#a0a0a0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 resize-none"
            />
            {bulkError && <p className="text-red-400 text-sm">{bulkError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkOpen(false)} className="text-[#a0a0a0]">
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={bulkSaving || !bulkJson.trim()}
              className="bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black font-semibold"
            >
              {bulkSaving && <Loader2 size={16} className="animate-spin mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
