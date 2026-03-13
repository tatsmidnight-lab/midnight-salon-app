import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ProductInput {
  name: string
  price: number
  description?: string
  category?: string
  sku?: string
  stock_qty?: number
}

export async function POST(request: Request) {
  const user = await getAuthUser(request)

  try {
    requireRole(user, 'admin')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 })
  }

  let body: { products?: ProductInput[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { products } = body

  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: 'products must be a non-empty array' }, { status: 400 })
  }

  // Validate each entry has required fields
  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    if (!p.name || p.price === undefined) {
      return NextResponse.json(
        { error: `products[${i}] is missing required fields: name, price` },
        { status: 400 }
      )
    }
  }

  const rows = products.map((p) => ({
    name: p.name,
    price: Number(p.price),
    description: p.description ?? null,
    category: p.category ?? null,
    sku: p.sku ?? null,
    stock_qty: p.stock_qty !== undefined ? Number(p.stock_qty) : null,
    is_active: true,
  }))

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(rows)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ inserted: data?.length ?? 0 }, { status: 201 })
}
