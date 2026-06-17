export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  const { postText = '', goal = '' } = await req.json()

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.9,
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Ты копирайтер premium beauty-бренда.
Создай ровно 3 заголовка для наложения на фото в соцсети.
Каждый заголовок: 3–7 слов на русском, ёмко, без банальностей.
Верни только JSON: { "headlines": ["...", "...", "..."] }`,
        },
        {
          role: 'user',
          content: `Текст поста:\n${postText.slice(0, 500)}\n\nЦель: ${goal}`,
        },
      ],
    })

    const json = JSON.parse(response.choices[0].message.content || '{}')
    return NextResponse.json({ headlines: json.headlines || [] })
  } catch {
    return NextResponse.json({ headlines: [] })
  }
}
