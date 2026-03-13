/**
 * POST /api/packages/create
 *
 * Creates a package with associated services and products.
 *
 * Body: {
 *   name: string,
 *   description: string,
 *   artist_id?: string,
 *   services: [{ service_id: string, quantity: number, include_free: boolean }],
 *   products: [{ product_id: string, quantity: number, include_free: boolean }],
 *   discount_percent: number,
 *   price?: number,
 *   image_url?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ServiceInput {
  service_id: string
  quantity: number
  include_free: boolean
}

interface ProductInput {
  product_id: string
  quantity: number
  include_free: boolean
}

interface CreatePackageBody {
  name: string
  description: string
  artist_id?: string
  services: ServiceInput[]
  products: ProductInput[]
  discount_percent: number
  price?: number
  image_url?: string
}

export async function POST(req: NextRequest) {
  let body: CreatePackageBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate required fields
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!Array.isArray(body.services)) {
    return NextResponse.json({ error: 'services must be an array' }, { status: 400 })
  }
  if (!Array.isArray(body.products)) {
    return NextResponse.json({ error: 'products must be an array' }, { status: 400 })
  }
  if (typeof body.discount_percent !== 'number' || body.discount_percent < 0 || body.discount_percent > 100) {
    return NextResponse.json({ error: 'discount_percent must be 0-100' }, { status: 400 })
  }

  try {
    // 1. Insert package
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .insert({
        name: body.name,
        description: body.description ?? null,
        artist_id: body.artist_id ?? null,
        discount_percent: body.discount_percent,
        price: body.price ?? null,
        image_url: body.image_url ?? null,
      })
      .select()
      .single()

    if (pkgError || !pkg) {
      throw new Error(pkgError?.message ?? 'Failed to create package')
    }

    // 2. Insert package_services
    if (body.services.length > 0) {
      const serviceRows = body.services.map((s) => ({
        package_id: pkg.id,
        service_id: s.service_id,
        quantity: s.quantity,
        include_free: s.include_free ?? false,
      }))

      const { error: svcError } = await supabaseAdmin
        .from('package_services')
        .insert(serviceRows)

      if (svcError) {
        // Rollback package
        await supabaseAdmin.from('packages').delete().eq('id', pkg.id)
        throw new Error(`Failed to insert package services: ${svcError.message}`)
      }
    }

    // 3. Insert package_products
    if (body.products.length > 0) {
      const productRows = body.products.map((p) => ({
        package_id: pkg.id,
        product_id: p.product_id,
        quantity: p.quantity,
        include_free: p.include_free ?? false,
      }))

      const { error: prodError } = await supabaseAdmin
        .from('package_products')
        .insert(productRows)

      if (prodError) {
        // Rollback
        await supabaseAdmin.from('package_services').delete().eq('package_id', pkg.id)
        await supabaseAdmin.from('packages').delete().eq('id', pkg.id)
        throw new Error(`Failed to insert package products: ${prodError.message}`)
      }
    }

    // 4. Fetch complete package with relations
    const { data: fullPackage } = await supabaseAdmin
      .from('packages')
      .select('*, package_services(*), package_products(*)')
      .eq('id', pkg.id)
      .single()

    return NextResponse.json({ package: fullPackage ?? pkg }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[packages/create]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
