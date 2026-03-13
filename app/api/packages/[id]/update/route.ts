/**
 * PATCH /api/packages/[id]/update
 *
 * Updates a package and replaces its services/products associations.
 *
 * Body: same fields as create (all optional except what you want to change)
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

interface UpdatePackageBody {
  name?: string
  description?: string
  artist_id?: string | null
  services?: ServiceInput[]
  products?: ProductInput[]
  discount_percent?: number
  price?: number | null
  image_url?: string | null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  let body: UpdatePackageBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (
    body.discount_percent !== undefined &&
    (typeof body.discount_percent !== 'number' || body.discount_percent < 0 || body.discount_percent > 100)
  ) {
    return NextResponse.json({ error: 'discount_percent must be 0-100' }, { status: 400 })
  }

  try {
    // 1. Update package row
    const updateFields: Record<string, unknown> = {}
    if (body.name !== undefined) updateFields.name = body.name
    if (body.description !== undefined) updateFields.description = body.description
    if (body.artist_id !== undefined) updateFields.artist_id = body.artist_id
    if (body.discount_percent !== undefined) updateFields.discount_percent = body.discount_percent
    if (body.price !== undefined) updateFields.price = body.price
    if (body.image_url !== undefined) updateFields.image_url = body.image_url
    updateFields.updated_at = new Date().toISOString()

    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json(
        { error: pkgError?.message ?? 'Package not found' },
        { status: 404 }
      )
    }

    // 2. Replace services if provided
    if (body.services !== undefined) {
      // Delete old
      const { error: delSvcError } = await supabaseAdmin
        .from('package_services')
        .delete()
        .eq('package_id', id)

      if (delSvcError) {
        throw new Error(`Failed to clear package services: ${delSvcError.message}`)
      }

      // Insert new
      if (body.services.length > 0) {
        const serviceRows = body.services.map((s) => ({
          package_id: id,
          service_id: s.service_id,
          quantity: s.quantity,
          include_free: s.include_free ?? false,
        }))

        const { error: insSvcError } = await supabaseAdmin
          .from('package_services')
          .insert(serviceRows)

        if (insSvcError) {
          throw new Error(`Failed to insert package services: ${insSvcError.message}`)
        }
      }
    }

    // 3. Replace products if provided
    if (body.products !== undefined) {
      // Delete old
      const { error: delProdError } = await supabaseAdmin
        .from('package_products')
        .delete()
        .eq('package_id', id)

      if (delProdError) {
        throw new Error(`Failed to clear package products: ${delProdError.message}`)
      }

      // Insert new
      if (body.products.length > 0) {
        const productRows = body.products.map((p) => ({
          package_id: id,
          product_id: p.product_id,
          quantity: p.quantity,
          include_free: p.include_free ?? false,
        }))

        const { error: insProdError } = await supabaseAdmin
          .from('package_products')
          .insert(productRows)

        if (insProdError) {
          throw new Error(`Failed to insert package products: ${insProdError.message}`)
        }
      }
    }

    // 4. Fetch complete updated package
    const { data: fullPackage } = await supabaseAdmin
      .from('packages')
      .select('*, package_services(*), package_products(*)')
      .eq('id', id)
      .single()

    return NextResponse.json({ package: fullPackage ?? pkg })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[packages/update]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
