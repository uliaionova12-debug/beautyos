export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Master } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  const { master }: { master: Master } = await req.json()

  const prompt = `Ты — AI-коуч для мастера в салоне красоты. Говори напрямую с мастером, на "вы", по-русски.

Данные мастера ${master.name}:
- Активных клиентов: ${master.active_clients_count}
- В группе риска: ${master.at_risk_clients_count}
- Потеряно клиентов: ${master.lost_clients_count}
- Возвратность: ${Math.round(master.retention_rate * 100)}%
- Средний чек: ${master.avg_check.toLocaleString('ru-RU')} ₽
- Общая выручка: ${master.total_revenue.toLocaleString('ru-RU')} ₽

Напиши персональную рекомендацию: 3-4 предложения, конкретно и по делу. Что сделать сегодня, чтобы вернуть клиентов из группы риска и увеличить повторные записи. Без воды.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 250,
    messages: [{ role: 'user', content: prompt }],
  })

  const message = response.choices[0].message.content?.trim() || ''
  return NextResponse.json({ message })
}
