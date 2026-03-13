import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const user = await getAuthUser(request)

  try {
    requireRole(user, 'admin')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, description, price, image_url, category, sku, stock_qty } = body as {
    name?: string
    description?: string
    price?: number
    image_url?: string
    category?: string
    sku?: string
    stock_qty?: number
  }

  if (!name || price === undefined) {
    return NextResponse.json({ error: 'name and price are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name,
      description: description ?? null,
      price: Number(price),
      image_url: image_url ?? null,
      category: category ?? null,
      sku: sku ?? null,
      stock_qty: stock_qty !== undefined ? Number(stock_qty) : null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
