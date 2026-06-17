export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  const { imageDataUrl, goal, postText } = await req.json()
  if (!imageDataUrl) return NextResponse.json({ error: 'imageDataUrl required' }, { status: 400 })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageDataUrl, detail: 'low' } },
            {
              type: 'text',
              text: `You are a luxury beauty brand art director. Analyze this image and pick the best typography style and text position for a social media overlay.

Styles:
- soft_luxury: Playfair Display regular, subtle gradient, feminine elegance
- minimal: Manrope light, barely-there gradient, clean modern
- editorial: Manrope 800 uppercase, bold statement, strong gradient
- magazine: Playfair Display bold, classic editorial gravitas
- premium: Manrope semibold uppercase, wide tracking, cream/gold text

Positions: top-left, top-center, top-right, center, bottom-left, bottom-center, bottom-right

Choose based on: where the image has clear area for text, the mood of the photo, and this post goal: "${goal}".
Post excerpt: "${(postText || '').slice(0, 120)}"

Reply ONLY with valid JSON, no markdown:
{"preset":"...","position":"...","reason":"одна фраза по-русски, почему именно этот стиль"}`,
            },
          ],
        },
      ],
    })

    const text = response.choices[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      preset:   result.preset   || 'soft_luxury',
      position: result.position || 'bottom-left',
      reason:   result.reason   || '',
    })
  } catch (err) {
    console.error('Auto-style error:', err)
    return NextResponse.json({ preset: 'soft_luxury', position: 'bottom-left', reason: '' })
  }
}
