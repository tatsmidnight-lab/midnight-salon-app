'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Camera, Loader2, CheckCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  phone: string;
  role: string;
  avatar_url?: string;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ display_name: '', email: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('salon_user');
    if (stored) {
      try {
        const u: UserProfile = JSON.parse(stored);
        setProfile(u);
        setForm({ display_name: u.display_name || '', email: u.email || '' });
        setAvatarPreview(u.avatar_url || '');
      } catch {}
    }
    setLoading(false);
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/customer/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      const data = await res.json();
      // Update local storage
      if (profile) {
        const updated = { ...profile, ...form };
        localStorage.setItem('salon_user', JSON.stringify(updated));
        setProfile(updated);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-[#1a1a1a] rounded animate-pulse" />
        <div className="h-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">My Profile</h2>
        <p className="text-[#a0a0a0] text-sm mt-1">Manage your personal information</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          Profile saved successfully
        </div>
      )}

      {/* Avatar section */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#2a2a2a]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#c9a84c]/10 border-2 border-[#2a2a2a] flex items-center justify-center">
                  <User size={32} className="text-[#c9a84c]" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={20} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{profile?.display_name || 'User'}</p>
              <p className="text-[#a0a0a0] text-sm capitalize">{profile?.role || 'customer'}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#c9a84c] hover:underline mt-1"
              >
                Change photo
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="text-xs text-[#a0a0a0] mb-1.5 block font-medium uppercase tracking-wider">
                Display Name
              </label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                placeholder="Your full name"
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0] focus-visible:ring-[#c9a84c]/30"
              />
            </div>

            <div>
              <label className="text-xs text-[#a0a0a0] mb-1.5 block font-medium uppercase tracking-wider">
                Email Address
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0] focus-visible:ring-[#c9a84c]/30"
              />
            </div>

            <div>
              <label className="text-xs text-[#a0a0a0] mb-1.5 block font-medium uppercase tracking-wider">
                Phone Number
              </label>
              <Input
                value={profile?.phone || ''}
                disabled
                className="bg-[#0f0f0f] border-[#2a2a2a] text-[#a0a0a0] cursor-not-allowed"
              />
              <p className="text-xs text-[#a0a0a0] mt-1.5">
                Phone is your login identity and cannot be changed here.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black font-semibold gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
            <span className="text-sm text-[#a0a0a0]">Account Type</span>
            <span className="text-sm text-white capitalize">{profile?.role || 'customer'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#a0a0a0]">Account ID</span>
            <span className="text-xs font-mono text-[#a0a0a0]">{profile?.id?.slice(0, 12)}…</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
