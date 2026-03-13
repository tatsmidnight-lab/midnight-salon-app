import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const packageId = searchParams.get('package_id')

  if (!packageId) {
    return NextResponse.json({ error: 'package_id is required' }, { status: 400 })
  }

  // Fetch the package itself
  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from('package_services')
    .select('*')
    .eq('id', packageId)
    .single()

  if (pkgError) {
    if (pkgError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }
    return NextResponse.json({ error: pkgError.message }, { status: 500 })
  }

  // Fetch package items
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('package_items')
    .select('*')
    .eq('package_id', packageId)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Hydrate each item with its service or product details
  const hydratedItems = await Promise.all(
    (items ?? []).map(async (item: Record<string, unknown>) => {
      if (item.service_id) {
        const { data: service } = await supabaseAdmin
          .from('services')
          .select('id, name, description, base_price, duration, image_url')
          .eq('id', item.service_id)
          .single()
        return { ...item, service, product: null }
      }

      if (item.product_id) {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('id, name, description, price, image_url, category, sku')
          .eq('id', item.product_id)
          .single()
        return { ...item, service: null, product }
      }

      return { ...item, service: null, product: null }
    })
  )

  return NextResponse.json({ ...pkg, items: hydratedItems })
}
