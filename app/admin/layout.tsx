'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Scissors,
  Package,
  ShoppingBag,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/services', label: 'Services', icon: Scissors },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState('Admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('salon_user') : null;
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setAdminName(user.display_name || 'Admin');
      } catch {
        // ignore
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = 'salon_token=; Max-Age=0; path=/';
    localStorage.removeItem('salon_user');
    router.push('/login');
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] z-30 flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#2a2a2a]">
          <span className="text-xl font-bold text-[#c9a84c] tracking-wide">Midnight</span>
          <span className="ml-2 text-xs text-[#a0a0a0] uppercase tracking-widest">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive(href)
                  ? 'bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20'
                  : 'text-[#a0a0a0] hover:text-white hover:bg-white/5'}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom user info */}
        <div className="px-4 py-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] text-sm font-bold">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{adminName}</p>
              <p className="text-xs text-[#a0a0a0]">Administrator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-[#a0a0a0] hover:text-red-400 hover:bg-red-400/10"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-[#1a1a1a]/80 backdrop-blur-md border-b border-[#2a2a2a] px-4 lg:px-8 py-4 flex items-center justify-between">
          <button
            className="lg:hidden text-[#a0a0a0] hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-sm text-[#a0a0a0] font-medium">
              Welcome back, <span className="text-white">{adminName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 px-2.5 py-1 rounded-full font-medium">
              Admin
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
