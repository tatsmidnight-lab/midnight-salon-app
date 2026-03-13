'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function CustomerCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setCart(getCart());
    setMounted(true);
  }, []);

  function updateQty(productId: string, delta: number) {
    const updated = cart
      .map((i) => (i.product_id === productId ? { ...i, quantity: i.quantity + delta } : i))
      .filter((i) => i.quantity > 0);
    setCart(updated);
    saveCart(updated);
  }

  function removeItem(productId: string) {
    const updated = cart.filter((i) => i.product_id !== productId);
    setCart(updated);
    saveCart(updated);
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  async function handleCheckout() {
    if (cart.length === 0) return;
    setPlacing(true);
    setError('');
    try {
      const res = await fetch('/api/orders/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.price,
          })),
          total,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to place order');
      }
      // Clear cart
      localStorage.removeItem('salon_cart');
      setCart([]);
      setSuccess(true);
      setTimeout(() => router.push('/customer/orders'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (!mounted) return null;

  if (success) {
    return (
      <div className="max-w-lg mx-auto pt-16 text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={36} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Order Placed!</h2>
        <p className="text-[#a0a0a0]">Your order has been confirmed. Redirecting to orders…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customer/shop">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-[#a0a0a0] hover:text-white">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Your Cart</h2>
          <p className="text-[#a0a0a0] text-sm">{cart.length} item type{cart.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart size={48} className="text-[#2a2a2a] mb-4" />
          <p className="text-white font-medium mb-1">Your cart is empty</p>
          <p className="text-[#a0a0a0] text-sm mb-4">Add some products from the shop</p>
          <Link href="/customer/shop">
            <Button className="bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black font-semibold">
              Browse Shop
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => (
              <Card key={item.product_id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Product icon */}
                  <div className="w-14 h-14 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingCart size={20} className="text-[#a0a0a0]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                    <p className="text-sm text-[#c9a84c] font-medium">${item.price.toFixed(2)} ea.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="w-7 h-7 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center justify-center text-white transition-colors"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-semibold text-white w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-7 h-7 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center justify-center text-white transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 ml-2">
                    <span className="text-sm font-bold text-white w-16 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-[#a0a0a0] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order summary */}
          <div>
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a0a0a0]">Subtotal</span>
                    <span className="text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a0a0a0]">Tax (8%)</span>
                    <span className="text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#2a2a2a] pt-2 flex justify-between">
                    <span className="text-sm font-semibold text-white">Total</span>
                    <span className="text-base font-bold text-[#c9a84c]">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="w-full bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black font-semibold gap-2 mt-2"
                >
                  {placing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Placing Order…
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </Button>

                <Link href="/customer/shop" className="block">
                  <Button
                    variant="ghost"
                    className="w-full text-[#a0a0a0] hover:text-white text-sm"
                  >
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
