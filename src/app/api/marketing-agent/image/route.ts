export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const GOAL_SCENES: Record<string, string> = {
  fill_slots:      'Elegant beauty salon interior with warm morning light, empty styling chair by a window, soft cream and beige tones',
  reactivate:      'Inviting beauty salon reception, fresh white flowers on marble counter, warm ambient light',
  raise_check:     'Luxurious beauty products arranged on white marble surface, clean minimal composition',
  collect_reviews: 'Close-up of beautifully manicured hands resting on cream linen, soft natural light',
  show_expertise:  'Professional beauty tools and implements laid out artfully on white stone, clinical elegance',
  salon_life:      'Cozy behind-the-scenes beauty salon moment, warm tones, genuine atmosphere',
  promote_master:  'A beautifully styled vanity table with personal professional tools, curated aesthetic',
  promote_service: 'Premium beauty service setting — polished surfaces, soft light, ready for work',
  seasonal:        'Seasonal botanical elements and beauty essentials, editorial flat lay, cream and gold tones',
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY не настроен на сервере' }, { status: 500 })
  }

  const { goal = '', platform = '' } = await req.json()

  const scene = GOAL_SCENES[goal] || 'Premium beauty salon interior with soft natural light'
  const aspectNote = (platform === 'instagram') ? 'square composition' : 'clean balanced composition'

  const prompt = `${scene}. Soft luxury beauty aesthetic, editorial magazine quality, natural daylight, airy minimalism, ${aspectNote}. No text, no people's faces, no logos. Photorealistic, high resolution.`

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard', // 'hd' takes 15-30 sec and risks timeout; standard is 8-12 sec
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      return NextResponse.json({ error: 'OpenAI не вернул URL изображения' }, { status: 500 })
    }

    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: `Не удалось загрузить изображение: ${imgRes.status}` }, { status: 500 })
    }
    const buffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return NextResponse.json({ imageDataUrl: `data:image/png;base64,${base64}`, prompt })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('DALL-E error:', msg)
    // Surface OpenAI error details so they're visible in the UI
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
