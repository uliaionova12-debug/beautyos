export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface Message { role: 'user' | 'assistant'; content: string }

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const atRiskList = (context.at_risk_top || [])
    .map((c: { name: string; phone: string | null; days_since: number; avg_interval: number; avg_check: number; visits: number }, i: number) =>
      `  ${i + 1}. ${c.name}${c.phone ? ` (${c.phone})` : ''} — ${c.days_since} дн. без визита (интервал ${c.avg_interval} дн.), чек ${fmt(c.avg_check)}, визитов: ${c.visits}`)
    .join('\n')

  const lostList = (context.lost_top || [])
    .map((c: { name: string; phone: string | null; days_since: number; avg_check: number; revenue_opportunity: number }, i: number) =>
      `  ${i + 1}. ${c.name}${c.phone ? ` (${c.phone})` : ''} — ${c.days_since} дн. без визита, чек ${fmt(c.avg_check)}, потенциал возврата ${fmt(c.revenue_opportunity)}`)
    .join('\n')

  const mastersList = (context.masters || [])
    .map((m: { name: string; retention_rate: number; avg_check: number; total_revenue: number; active_clients_count: number; at_risk_clients_count: number }) =>
      `  • ${m.name}: возвратность ${Math.round((m.retention_rate || 0) * 100)}%, чек ${fmt(m.avg_check)}, активных ${m.active_clients_count}, в риске ${m.at_risk_clients_count}`)
    .join('\n')

  const system = `Ты — AI Директор BeautyOS, персональный бизнес-советник салона красоты${context.salon_name ? ` «${context.salon_name}»` : ''}.

═══ РЕАЛЬНЫЕ ДАННЫЕ САЛОНА ═══

Клиентская база:
  Всего клиентов: ${context.total_clients ?? 0}
  Активных: ${context.active_clients ?? 0}
  В группе риска: ${context.at_risk_count ?? 0}
  Потеряно: ${context.lost_count ?? 0}
  Возвратность: ${context.retention_rate ?? 0}%

Финансы:
  Общая выручка: ${fmt(context.total_revenue ?? 0)}
  Средний чек: ${fmt(context.avg_check ?? 0)}
  Потенциал от клиентов в риске: ${fmt(context.at_risk_revenue ?? 0)}
  Финансовый ущерб от потерянных: ${fmt(context.lost_impact ?? 0)}

${atRiskList ? `Клиенты в группе риска (топ по вероятности возврата):\n${atRiskList}` : ''}

${lostList ? `Потерянные клиенты (топ по потенциалу):\n${lostList}` : ''}

${mastersList ? `Мастера:\n${mastersList}` : ''}

═══ ПРАВИЛА ═══
- Отвечай КОНКРЕТНО, называй имена клиентов и цифры из данных выше
- Когда рекомендуешь связаться с клиентом — указывай имя и телефон (если есть)
- 3–5 предложений, без воды и общих слов
- Тон: доверенный директор, говорит как профессионал
- Только русский язык, обращение на «вы»`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 450,
    temperature: 0.4,
    messages: [{ role: 'system', content: system }, ...messages],
  })

  return NextResponse.json({ message: response.choices[0].message.content?.trim() ?? '' })
}
