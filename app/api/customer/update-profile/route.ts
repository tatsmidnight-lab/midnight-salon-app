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

async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('salon_token')?.value;
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return { id: payload.sub || payload.id, role: payload.role };
  } catch {
    return null;
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { display_name, email } = body;

  const update: Record<string, string> = {};
  if (display_name !== undefined) update.display_name = display_name;
  if (email !== undefined) update.email = email;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // Customers can only update their own profile
  const url = `${supabaseUrl}/rest/v1/users?id=eq.${user.id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getSupabaseHeaders(),
    body: JSON.stringify(update),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: 'Failed to update profile', detail: text }, { status: 500 });
  }

  const updated = await res.json();
  return NextResponse.json({ user: updated[0] ?? null });
}
