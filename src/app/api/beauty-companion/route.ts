export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface Message { role: 'user' | 'assistant'; content: string }

interface ClientContext {
  client_name: string
  last_service: string
  last_master: string
  last_date: string
  history: { service: string; date: string }[]
  season: string
  scenario?: string
}

export async function POST(req: NextRequest) {
  const { messages, context }: { messages: Message[]; context: ClientContext } = await req.json()

  const historyStr = context.history
    .map(h => `${h.service} (${h.date})`)
    .join(', ')

  const system = `Ты — Beauty Companion для ${context.client_name}.

Ты персональный советник по красоте. Ты НЕ продаёшь услуги. Ты НЕ рекламируешь. Ты не чат-бот.
Твоя цель — создавать ощущение персональной заботы и внимания к человеку.

ИСТОРИЯ КЛИЕНТА:
- Имя: ${context.client_name} (используй строго это имя, не добавляй фамилию или отчество)
- Последний визит: ${context.last_service} у ${context.last_master}, ${context.last_date}
- История: ${historyStr || 'нет данных'}
- Сезон: ${context.season}
${context.scenario ? `- Контекст: ${context.scenario}` : ''}

ТВОИ ПРАВИЛА:
- Тёплый, личный тон — как доверенный советник, который помнит вас
- Конкретные советы по домашнему уходу, актуальные для проведённых процедур
- Учитывай сезон, возможные события, историю визитов
- НИКОГДА не упоминай цены, скидки, записи, рекламу
- 2–4 предложения, не больше
- Обращайся на «вы», тепло и заботливо
- Только русский язык
- СТРОГО: не дополняй имя клиента — используй только то, что указано выше, без изменений`

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ message: 'AI_NOT_CONFIGURED' })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 220,
      messages: [{ role: 'system', content: system }, ...messages],
    })
    return NextResponse.json({ message: response.choices[0].message.content?.trim() ?? '' })
  } catch {
    return NextResponse.json({ message: 'AI_TEMPORARILY_UNAVAILABLE' })
  }
}
