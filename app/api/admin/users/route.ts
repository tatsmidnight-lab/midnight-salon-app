import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getSupabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_KEY || '',
    Authorization: `Bearer ${process.env.SUPABASE_KEY || ''}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function verifyAdmin(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('salon_token')?.value;
  if (!token) return null;

  try {
    // Decode JWT payload (not verifying signature — middleware handles that)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    if (payload.role !== 'admin') return null;
    return { id: payload.sub || payload.id, role: payload.role };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const url = `${supabaseUrl}/rest/v1/users?select=id,display_name,phone,email,role,created_at&order=created_at.desc`;

  const res = await fetch(url, { headers: getSupabaseHeaders() });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: 'Failed to fetch users', detail: text }, { status: 500 });
  }

  const users = await res.json();
  return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
  }

  const { id, role, display_name, email } = body;

  // Build update payload from provided fields
  const update: Record<string, string> = {};
  if (role) update.role = role;
  if (display_name !== undefined) update.display_name = display_name;
  if (email !== undefined) update.email = email;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const url = `${supabaseUrl}/rest/v1/users?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getSupabaseHeaders(),
    body: JSON.stringify(update),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: 'Failed to update user', detail: text }, { status: 500 });
  }

  const updated = await res.json();
  return NextResponse.json({ user: updated[0] ?? null });
}
