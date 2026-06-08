import OpenAI from 'openai'
import { RetentionAnalysis } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽'
}

function formatPct(n: number): string {
  return Math.round(n * 100) + '%'
}

export async function generateRetentionInsights(
  analysis: RetentionAnalysis
): Promise<{ insights: string[]; recommendation: string }> {
  const worstMasters = [...analysis.masters]
    .sort((a, b) => a.retention_rate - b.retention_rate)
    .slice(0, 3)

  const prompt = `Ты — AI Retention Director для салона красоты. Тебе передана статистика.
Отвечай строго на русском языке. Будь конкретным, говори как опытный бизнес-консультант.

ДАННЫЕ САЛОНА (90 дней):
- Всего клиентов в базе: ${analysis.total_clients}
- Активных клиентов: ${analysis.active_clients} (${formatPct(analysis.retention_rate)})
- Клиентов в группе риска: ${analysis.at_risk_clients}
- Потерянных клиентов: ${analysis.lost_clients}
- Расчётный финансовый ущерб: ${formatMoney(analysis.total_financial_impact)}

МАСТЕРА (по возвратности, худшие):
${worstMasters.map(m => `- ${m.name}: возвратность ${formatPct(m.retention_rate)}, потерянных клиентов: ${m.lost_clients_count}`).join('\n')}

Сформируй ответ строго в JSON формате:
{
  "insights": [
    "инсайт 1 (конкретный, с числами, 1-2 предложения)",
    "инсайт 2 (конкретный, с числами, 1-2 предложения)",
    "инсайт 3 (конкретный, с числами, 1-2 предложения)"
  ],
  "recommendation": "одно главное действие, которое нужно сделать сегодня (2-3 предложения, конкретно)"
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.choices[0].message.content || '{}'
  const parsed = JSON.parse(text)

  return {
    insights: parsed.insights || [],
    recommendation: parsed.recommendation || '',
  }
}

export async function generateReturnMessage(
  clientName: string,
  avgCheck: number,
  lastService: string,
  salonName: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Напиши короткое персональное сообщение для возврата клиента в салон красоты.

Клиент: ${clientName}
Последняя услуга: ${lastService || 'маникюр'}
Средний чек: ${formatMoney(avgCheck)}
Салон: ${salonName}

Требования:
- Максимум 3 предложения
- Тёплый, не навязчивый тон
- Без скидок и акций (не обесценивай)
- На русском языке
- Только текст сообщения, без кавычек и пояснений`,
      },
    ],
  })

  return response.choices[0].message.content?.trim() || ''
}
