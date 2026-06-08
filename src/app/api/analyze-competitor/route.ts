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
    .slice(0, 6000)
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BeautyOS/1.0)',
        'Accept-Language': 'ru-RU,ru;q=0.9',
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
    const { url, competitor_name, salon_avg_check } = await req.json()

    if (!url || !competitor_name) {
      return NextResponse.json({ error: 'Нужны url и competitor_name' }, { status: 400 })
    }

    const pageText = await fetchPage(url)

    const contextBlock = pageText
      ? `Содержимое страницы:\n${pageText}`
      : `Страницу не удалось загрузить. Проанализируй на основе названия и URL: ${url}`

    const prompt = `Ты — бизнес-аналитик для салона красоты. Проанализируй конкурента.

Конкурент: ${competitor_name}
URL: ${url}
Наш средний чек: ${salon_avg_check ? salon_avg_check + ' ₽' : 'неизвестен'}

${contextBlock}

Ответь строго в JSON (без markdown, только JSON):
{
  "price_range": "диапазон цен конкурента или null если не найдено",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "weaknesses": ["слабость 1", "слабость 2"],
  "services_highlight": "ключевые услуги или специализация одной фразой",
  "recommendation": "конкретный совет что взять на вооружение или чем отстроиться (2-3 предложения)",
  "page_loaded": ${pageText ? 'true' : 'false'}
}`

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 600,
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
