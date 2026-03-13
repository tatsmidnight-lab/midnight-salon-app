'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search, Package, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name?: string;
  category?: string;
  price?: number;
  stock_qty?: number;
  status?: string;
  description?: string;
  image_url?: string;
}

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem('salon_cart') || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem('salon_cart', JSON.stringify(cart));
}

export default function CustomerShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    setCart(getCart());
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products/get-all-products');
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts((data.products || []).filter((p: Product) => p.status === 'active'));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ['All', ...cats] as string[];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  function addToCart(product: Product) {
    const updated = [...cart];
    const existing = updated.find((i) => i.product_id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      updated.push({
        product_id: product.id,
        name: product.name || 'Product',
        price: product.price || 0,
        quantity: 1,
      });
    }
    setCart(updated);
    saveCart(updated);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const inCart = (id: string) => cart.some((i) => i.product_id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Shop</h2>
          <p className="text-[#a0a0a0] text-sm mt-1">{filtered.length} products</p>
        </div>
        <Link href="/customer/cart">
          <Button
            variant="outline"
            className="border-[#2a2a2a] text-white hover:border-[#c9a84c] hover:text-[#c9a84c] gap-2 relative"
          >
            <ShoppingCart size={16} />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#c9a84c] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0] focus-visible:ring-[#c9a84c]/30"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
              ${activeCategory === cat
                ? 'bg-[#c9a84c] border-[#c9a84c] text-black'
                : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#a0a0a0] hover:border-[#c9a84c]/40 hover:text-white'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package size={48} className="text-[#2a2a2a] mb-4" />
          <p className="text-white font-medium mb-1">No products found</p>
          <p className="text-[#a0a0a0] text-sm">Try adjusting your search or category filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const justAdded = addedId === product.id;
            const alreadyInCart = inCart(product.id);
            const outOfStock = product.stock_qty === 0;
            return (
              <Card
                key={product.id}
                className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#c9a84c]/20 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Image placeholder */}
                <div className="h-44 bg-[#0f0f0f] flex items-center justify-center border-b border-[#2a2a2a]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={40} className="text-[#2a2a2a]" />
                  )}
                </div>

                <CardContent className="p-4 flex flex-col flex-1 gap-3">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white leading-tight">{product.name}</p>
                      {product.category && (
                        <Badge variant="outline" className="text-[10px] border-[#2a2a2a] text-[#a0a0a0] shrink-0">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-xs text-[#a0a0a0] mt-1.5 line-clamp-2">{product.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#c9a84c]">
                      ${(product.price || 0).toFixed(2)}
                    </span>
                    {outOfStock ? (
                      <span className="text-xs text-red-400">Out of stock</span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={outOfStock || justAdded}
                        onClick={() => addToCart(product)}
                        className={`text-xs gap-1.5 transition-all duration-200 ${
                          justAdded
                            ? 'bg-green-500 hover:bg-green-500 text-white'
                            : 'bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black'
                        }`}
                      >
                        {justAdded ? (
                          <>
                            <CheckCircle size={13} />
                            Added!
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={13} />
                            {alreadyInCart ? 'Add More' : 'Add to Cart'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
