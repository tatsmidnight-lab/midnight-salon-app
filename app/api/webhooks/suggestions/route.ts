import { NextResponse } from 'next/server'
import { triggerServiceSuggestions } from '@/lib/n8n'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = await triggerServiceSuggestions({
      customer_id: body.customerId ?? '',
      voice_transcript: body.transcript ?? body.voice_transcript ?? '',
      count: body.count ?? 3,
      style_preferences: body.preferences ?? [],
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[webhook/suggestions]', error)
    return NextResponse.json(
      {
        suggestions: [
          {
            service_name: 'Custom Color & Highlights',
            description: 'Personalized color treatment tailored to your unique features.',
            estimated_price: 160,
            estimated_duration: 120,
            confidence_score: 0.88,
          },
          {
            service_name: 'Signature Cut & Style',
            description: 'Precision haircut with expert blowout and styling.',
            estimated_price: 85,
            estimated_duration: 60,
            confidence_score: 0.82,
          },
          {
            service_name: 'Gloss & Shine Treatment',
            description: 'A clear or tinted gloss that adds mirror-like shine.',
            estimated_price: 65,
            estimated_duration: 30,
            confidence_score: 0.74,
          },
        ],
      },
      { status: 200 }
    )
  }
}
