import Anthropic from '@anthropic-ai/sdk'
import { RetentionAnalysis } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
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

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (message.content[0] as { type: string; text: string }).text
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    return {
      insights: ['AI-анализ временно недоступен'],
      recommendation: 'Проверьте данные и попробуйте снова',
    }
  }

  const parsed = JSON.parse(jsonMatch[0])
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
  const prompt = `Напиши короткое персональное сообщение для возврата клиента в салон красоты.

Клиент: ${clientName}
Последняя услуга: ${lastService || 'маникюр'}
Средний чек: ${formatMoney(avgCheck)}
Салон: ${salonName}

Требования:
- Максимум 3 предложения
- Тёплый, не навязчивый тон
- Без скидок и акций (не обесценивай)
- На русском языке
- Только текст сообщения, без кавычек и пояснений`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  return (message.content[0] as { type: string; text: string }).text.trim()
}
