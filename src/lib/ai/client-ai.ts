// ─── Client AI Layer ─────────────────────────────────────────────────────────
//
// Architecture:
//   Input  → ClientSnapshot (pre-computed by backend, read-only)
//   Output → ClientAIOutput (human-language interpretation only)
//
// Four modules, one LLM call, structured JSON response:
//
//   Module 1 — Beauty Care Agent
//     Personalized home-care advice based on last service + season.
//     Non-medical. No products. No diagnoses.
//
//   Module 2 — Booking Assistant
//     Interprets the next-visit window (backend-computed avg_interval_days).
//     Does NOT compute intervals. Only reads days_since_last_visit and explains it.
//     Produces a warm call-to-action tied to salon.booking_url.
//
//   Module 3 — Insight Generator
//     One sentence summarizing client behavior from total_visits / status / freq.
//     No predictions. No judgements. Just a factual observation in human language.
//
//   Module 4 — Retention Assistant
//     Explains client status ('at_risk' / 'lost' / 'active') in plain language.
//     Does NOT recalculate risk. Reads status field verbatim.
//     Output is for the client, not the salon owner.
//
// Safety contract:
//   • AI reads snapshot fields — never overrides them
//   • AI does not produce medical advice under any circumstances
//   • AI does not invent visits, amounts, or dates
//   • Temperature 0.4 — consistent, not creative
//   • If snapshot is empty → returns safe fallback strings, no API call
//
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientSnapshot {
  client: {
    name: string
    status: 'active' | 'at_risk' | 'lost' | string
    avg_check: number
    days_since_last_visit: number | null
    avg_interval_days: number | null
    total_visits: number
    total_revenue: number
    last_visit_date: string | null
  }
  salon: {
    name: string
    booking_url: string
  }
  visits: Array<{
    service_name: string | null
    amount: number | null
    visit_date: string | null
    master_name: string | null
  }>
}

export interface ClientAIOutput {
  care_message: string           // Module 1: Beauty Care Agent
  booking_recommendation: string // Module 2: Booking Assistant
  client_insight: string         // Insight Generator
  retention_explanation: string  // Retention Assistant
}

// ─── Season helper ────────────────────────────────────────────────────────────

function currentSeason(): string {
  const m = new Date().getMonth()
  if (m >= 2 && m <= 4) return 'весна'
  if (m >= 5 && m <= 7) return 'лето'
  if (m >= 8 && m <= 10) return 'осень'
  return 'зима'
}

// ─── Context builder ──────────────────────────────────────────────────────────
// Converts structured data into a readable snapshot block for the LLM.
// Never passes raw numbers without labels — LLM must know what each means.

function buildContextBlock(snap: ClientSnapshot): string {
  const { client, salon, visits } = snap
  const lastVisit = visits[0] ?? null
  const recentServices = [...new Set(
    visits.slice(0, 5).map(v => v.service_name).filter(Boolean)
  )] as string[]

  const statusLabel: Record<string, string> = {
    active:   'активный клиент (регулярно посещает)',
    at_risk:  'клиент в зоне риска (пауза дольше обычного)',
    lost:     'клиент не возвращается очень долго',
  }

  const lines: string[] = [
    `КЛИЕНТ: ${client.name}`,
    `СТАТУС: ${statusLabel[client.status] ?? client.status}`,
    `ВСЕГО ВИЗИТОВ: ${client.total_visits}`,
    client.days_since_last_visit !== null
      ? `ДНЕЙ С ПОСЛЕДНЕГО ВИЗИТА: ${client.days_since_last_visit}`
      : 'ДНЕЙ С ПОСЛЕДНЕГО ВИЗИТА: нет данных',
    client.avg_interval_days !== null
      ? `ОБЫЧНЫЙ ИНТЕРВАЛ МЕЖДУ ВИЗИТАМИ: ${client.avg_interval_days} дней`
      : 'ОБЫЧНЫЙ ИНТЕРВАЛ: нет данных',
    lastVisit?.service_name
      ? `ПОСЛЕДНЯЯ УСЛУГА: ${lastVisit.service_name}`
      : 'ПОСЛЕДНЯЯ УСЛУГА: нет данных',
    lastVisit?.master_name
      ? `МАСТЕР: ${lastVisit.master_name}`
      : '',
    recentServices.length > 0
      ? `НЕДАВНИЕ УСЛУГИ: ${recentServices.join(', ')}`
      : '',
    `САЛОН: ${salon.name || 'не указан'}`,
    salon.booking_url
      ? `ССЫЛКА НА ЗАПИСЬ: ${salon.booking_url}`
      : 'ССЫЛКА НА ЗАПИСЬ: нет',
    `СЕЗОН: ${currentSeason()}`,
  ]

  return lines.filter(Boolean).join('\n')
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Ты — интеллектуальный слой BeautyOS для клиентской стороны приложения.

Ты получаешь структурированный снапшот клиента из базы данных (поля уже вычислены бэкендом).
Твоя задача — интерпретировать эти данные тёплым человеческим языком.

═══════════════════════════
АБСОЛЮТНЫЕ ЗАПРЕТЫ
═══════════════════════════
✗ НЕ вычислять метрики (интервалы, проценты, баллы) — они уже в снапшоте
✗ НЕ давать медицинских советов, диагнозов, назначений
✗ НЕ упоминать цены, скидки, акции
✗ НЕ придумывать данные, которых нет в снапшоте
✗ НЕ использовать маркетинговые формулы (AIDA, призывы "Записывайтесь прямо сейчас!")
✗ НЕ ставить диагнозы состоянию кожи или ногтей
✗ НЕ добавлять фамилию, отчество или любые другие части имени к полю КЛИЕНТ — используй имя строго как оно записано в снапшоте, без изменений

═══════════════════════════
ОБЯЗАТЕЛЬНО
═══════════════════════════
✓ Читай только поля из снапшота — не придумывай
✓ Обращение на «вы», тепло, без пафоса
✓ Каждый модуль — одно короткое сообщение (2–3 предложения максимум)
✓ Только русский язык

═══════════════════════════
ЧЕТЫРЕ МОДУЛЯ
═══════════════════════════

MODULE 1 — care_message (Beauty Care Agent):
Персональный совет по домашнему уходу на основе последней услуги и сезона.
Тон: как опытный мастер, который помнит клиента лично.
Только общие рекомендации по уходу: увлажнение, защита от сезона, бережное обращение.
ЗАПРЕЩЕНО: конкретные препараты, медицинские термины, диагнозы.

MODULE 2 — booking_recommendation (Booking Assistant):
Мягкая рекомендация о времени следующего визита.
Читай поле "ДНЕЙ С ПОСЛЕДНЕГО ВИЗИТА" и "ОБЫЧНЫЙ ИНТЕРВАЛ" — не вычисляй самостоятельно.
Если есть ссылка на запись — упомяни, что можно записаться онлайн (не навязчиво).
2 предложения максимум.

MODULE 3 — client_insight (Insight Generator):
Одно предложение — наблюдение о поведении клиента на основе данных.
Пример: "За [N] визитов вы стали постоянным гостем [имя мастера]."
Только факты. Без оценок, без предсказаний.

MODULE 4 — retention_explanation (Retention Assistant):
Объяснение статуса клиента для самого клиента (не для владельца!).
Статус 'active' → тёплое подтверждение регулярности.
Статус 'at_risk' → деликатный сигнал, что прошло чуть больше времени, чем обычно.
Статус 'lost' → нейтральное приглашение вернуться (без давления).
1–2 предложения. Никакого осуждения.

═══════════════════════════
ФОРМАТ ОТВЕТА
═══════════════════════════
Верни ТОЛЬКО валидный JSON без markdown, без пояснений:

{
  "care_message": "...",
  "booking_recommendation": "...",
  "client_insight": "...",
  "retention_explanation": "..."
}`

// ─── Fallback output (used when snapshot is empty or API fails) ───────────────

function fallbackOutput(clientName: string): ClientAIOutput {
  return {
    care_message:           'Увлажнение — основа ухода в любое время года. Уделяйте несколько минут в день, и результат будет держаться дольше.',
    booking_recommendation: 'Когда будете готовы к следующему визиту — мастер всегда рад вас видеть.',
    client_insight:         `${clientName} — гость салона.`,
    retention_explanation:  'Будем рады видеть вас снова.',
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateClientAI(snap: ClientSnapshot): Promise<ClientAIOutput> {
  if (!snap.client.name) {
    return fallbackOutput('Гость')
  }

  const contextBlock = buildContextBlock(snap)

  let raw: string
  try {
    const response = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      temperature: 0.4,
      max_tokens:  600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `═══ СНАПШОТ КЛИЕНТА ═══\n${contextBlock}\n\nСформируй все четыре модуля.`,
        },
      ],
    })
    raw = response.choices[0].message.content?.trim() ?? ''
  } catch {
    return fallbackOutput(snap.client.name)
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ClientAIOutput>
    const fallback = fallbackOutput(snap.client.name)
    return {
      care_message:           parsed.care_message           || fallback.care_message,
      booking_recommendation: parsed.booking_recommendation || fallback.booking_recommendation,
      client_insight:         parsed.client_insight         || fallback.client_insight,
      retention_explanation:  parsed.retention_explanation  || fallback.retention_explanation,
    }
  } catch {
    return fallbackOutput(snap.client.name)
  }
}
