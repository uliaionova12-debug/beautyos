export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  const { photos, postText = '', goal = '' } = await req.json()

  if (!Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json({ analysis: '' }, { status: 400 })
  }

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `Ты маркетолог beauty-салона, помогаешь выбрать лучшее фото для публикации.

Пост: "${postText.slice(0, 300)}"
Задача: ${goal}

Проанализируй ${photos.length > 1 ? `${photos.length} фотографий` : 'фотографию'} и скажи:
1. Какое фото лучше всего подходит для этого поста (Фото 1, Фото 2...)?
2. Почему — 1 предложение про свет, состав, настроение
3. Что сделает публикацию сильнее — 1 практический совет

Ответ короткий, на русском.`,
    },
    ...photos.slice(0, 5).map((dataUrl: string) => ({
      type: 'image_url' as const,
      image_url: { url: dataUrl, detail: 'low' as const },
    })),
  ]

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 350,
      messages: [{ role: 'user', content }],
    })
    return NextResponse.json({ analysis: response.choices[0].message.content?.trim() || '' })
  } catch {
    return NextResponse.json({ analysis: '' }, { status: 500 })
  }
}
