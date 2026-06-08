export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Master } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface Message { role: 'user' | 'assistant'; content: string }

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

export async function POST(req: NextRequest) {
  const { messages, master }: { messages: Message[]; master: Master } = await req.json()

  const system = `Ты — AI Коуч BeautyOS для мастера ${master.name}.

ДАННЫЕ ПРАКТИКИ:
- Активных клиентов: ${master.active_clients_count}
- В группе риска: ${master.at_risk_clients_count}
- Потеряно: ${master.lost_clients_count}
- Возвратность: ${Math.round(master.retention_rate * 100)}%
- Средний чек: ${fmt(master.avg_check)}
- Общая выручка: ${fmt(master.total_revenue)}

ПРАВИЛА:
- Помогаешь мастеру расти: удерживать клиентов, увеличивать доход, развивать практику
- Конкретные советы: что именно написать, кому позвонить, что предложить
- 3–4 предложения, практично
- Поддерживающий и мотивирующий тон
- Обращайся на «вы»
- Только русский язык`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 280,
    messages: [{ role: 'system', content: system }, ...messages],
  })

  return NextResponse.json({ message: response.choices[0].message.content?.trim() ?? '' })
}
