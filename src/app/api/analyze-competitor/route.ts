export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 4000)
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return stripHtml(html)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { urls, competitor_name, salon_avg_check, our_services } = await req.json()

    if (!urls?.length || !competitor_name) {
      return NextResponse.json({ error: 'Нужны urls и competitor_name' }, { status: 400 })
    }

    // Загружаем все источники параллельно
    const pageTexts = await Promise.all((urls as string[]).map(fetchPage))
    const loadedCount = pageTexts.filter(Boolean).length

    const contextBlock = loadedCount > 0
      ? pageTexts
          .map((text, i) => text ? `--- Источник ${i + 1} (${urls[i]}):\n${text}` : `--- Источник ${i + 1}: не загрузился`)
          .join('\n\n')
      : `Страницы не загрузились. Анализируй по названию и URL: ${urls.join(', ')}`

    const ourServicesBlock = our_services?.length
      ? `Наши услуги: ${our_services.join(', ')}`
      : ''

    const prompt = `Ты — бизнес-аналитик для салона красоты. Сделай глубокий анализ конкурента.

Конкурент: ${competitor_name}
Источники: ${urls.join(', ')}
Наш средний чек: ${salon_avg_check ? salon_avg_check + ' ₽' : 'неизвестен'}
${ourServicesBlock}

${contextBlock}

Ответь СТРОГО в JSON без markdown, только валидный JSON:
{
  "price_comparison": [
    {"service": "название услуги", "their_price": "цена или null", "vs_note": "дороже/дешевле/аналогично нам или null"}
  ],
  "online_presence": {
    "has_online_booking": true или false или null,
    "social_media_active": true или false или null,
    "responds_to_reviews": true или false или null,
    "notes": "краткое описание онлайн-присутствия"
  },
  "threat_score": число от 1 до 5 (1=не опасны, 5=очень опасны),
  "threat_reason": "почему такой уровень угрозы (1 предложение)",
  "strengths": ["сильная сторона 1", "сильная сторона 2", "сильная сторона 3"],
  "weaknesses": ["слабость 1", "слабость 2"],
  "services_highlight": "специализация и ключевые услуги одной фразой",
  "services_we_lack": ["услуга которой у нас нет 1", "услуга 2"],
  "recommendation": "конкретный совет — что взять на вооружение или как отстроиться (2-3 предложения)",
  "page_loaded": ${loadedCount > 0 ? 'true' : 'false'}
}`

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 900,
    })

    const raw = res.choices[0]?.message?.content || '{}'
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    const analysis = JSON.parse(cleaned)

    return NextResponse.json({ success: true, analysis })
  } catch (err) {
    console.error('Competitor analysis error:', err)
    return NextResponse.json({ error: 'Не удалось проанализировать' }, { status: 500 })
  }
}
