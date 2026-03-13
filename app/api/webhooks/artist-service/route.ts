import { NextResponse } from 'next/server'
import { triggerArtistServiceCreation } from '@/lib/n8n'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = await triggerArtistServiceCreation({
      artist_id: body.artistId ?? 'unknown',
      artist_name: body.artistName ?? '',
      voice_transcript: body.transcript ?? body.voice_transcript ?? '',
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[webhook/artist-service]', error)
    return NextResponse.json(
      {
        ok: true,
        service: { name: '', description: '', price: 0, duration: 60 },
        message: 'Webhook unavailable — please fill in details manually.',
      },
      { status: 200 }
    )
  }
}
