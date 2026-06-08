export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface Message { role: 'user' | 'assistant'; content: string }

interface Context {
  salon_name?: string
  total_clients?: number
  at_risk_count?: number
  at_risk_revenue?: number
  lost_count?: number
  lost_impact?: number
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

export async function POST(req: NextRequest) {
  const { messages, context }: { messages: Message[]; context: Context } = await req.json()

  const system = `Ты — AI Директор BeautyOS, бизнес-советник для салона красоты${context.salon_name ? ` «${context.salon_name}»` : ''}.

ТЕКУЩИЕ ДАННЫЕ САЛОНА:
- Всего клиентов: ${context.total_clients ?? 'нет данных'}
- В группе риска: ${context.at_risk_count ?? 0} (потенциальная выручка ${fmt(context.at_risk_revenue ?? 0)})
- Потеряно клиентов: ${context.lost_count ?? 0} (ущерб ${fmt(context.lost_impact ?? 0)})

ПРАВИЛА:
- Отвечай конкретно, опираясь на данные выше
- 3–5 предложений, без воды
- Давай конкретные, выполнимые рекомендации
- Тон: доверенный бизнес-советник, не общий AI
- Обращайся на «вы»
- Только русский язык`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 320,
    messages: [{ role: 'system', content: system }, ...messages],
  })

  return NextResponse.json({ message: response.choices[0].message.content?.trim() ?? '' })
}
