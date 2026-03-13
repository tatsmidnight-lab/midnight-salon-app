import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const serviceId = searchParams.get('service_id')

  if (!serviceId) {
    return NextResponse.json({ error: 'service_id is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('service_variants')
    .select('*')
    .eq('service_id', serviceId)
    .order('sort_order')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
