// ─── Contextual Content Engine ───────────────────────────────────────────────
//
// Принцип: контент генерируется ТОЛЬКО из реальных бизнес-событий.
// Если значимого события нет → NO_CONTENT_EVENT.
// Никакой генерации "для галочки".
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Event types ─────────────────────────────────────────────────────────────

export type EventType =
  | 'client_returned'      // клиент из at_risk вернулся
  | 'client_no_show'       // пропущенные визиты
  | 'low_occupancy_day'    // много пустых окон
  | 'upsell_success'       // визит сильно выше среднего чека
  | 'negative_review'      // плохой внутренний отзыв
  | 'master_free_slots'    // мастер с низкой загрузкой
  | 'peak_day'             // очень насыщенный день
  | 'at_risk_alert'        // критическое число клиентов в риске
  | 'seasonal_pattern'     // сезонный сигнал
  | 'low_retention'        // возвратность ниже порога

export interface ContentEvent {
  type: EventType
  weight: number            // приоритет (выше = интереснее для контента)
  data: Record<string, string | number | boolean>
  source: string            // откуда взяли: 'snapshot' | 'visits' | 'reviews' | 'season'
}

// ─── Content types ───────────────────────────────────────────────────────────

export type ContentType =
  | 'observation'          // что заметили сегодня
  | 'client_story'         // анонимный реальный случай
  | 'master_insight'       // профессиональное наблюдение
  | 'warning'              // сезонное / риск
  | 'growth_insight'       // что улучшается
  | 'behind_scenes'        // будни салона

// Каждый тип события → тип контента
export const EVENT_TO_CONTENT_TYPE: Record<EventType, ContentType> = {
  client_returned:  'client_story',
  client_no_show:   'behind_scenes',
  low_occupancy_day:'behind_scenes',
  upsell_success:   'master_insight',
  negative_review:  'observation',
  master_free_slots:'behind_scenes',
  peak_day:         'observation',
  at_risk_alert:    'warning',
  seasonal_pattern: 'warning',
  low_retention:    'growth_insight',
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  observation:    'Наблюдение',
  client_story:   'История клиентки',
  master_insight: 'Наблюдение мастера',
  warning:        'Предупреждение',
  growth_insight: 'О росте',
  behind_scenes:  'Будни салона',
}

// ─── Visit data type (from Supabase) ─────────────────────────────────────────

export interface VisitRow {
  service_name: string | null
  amount: number | null
  visit_date: string | null
  master_name: string | null
}

export interface ClientRow {
  status: string
  days_since_last_visit: number | null
  avg_check: number | null
}

export interface ReviewRow {
  rating: number
  text: string | null
  created_at: string
}

// ─── Event extraction from snapshot data ─────────────────────────────────────

export function extractEventsFromSnapshot(data: {
  at_risk_clients: number
  empty_slots: number
  return_rate: number
  total_clients: number
}): ContentEvent[] {
  const events: ContentEvent[] = []

  // at_risk_alert: >10% базы или >5 человек
  if (data.at_risk_clients >= 5 || (data.total_clients > 0 && data.at_risk_clients / data.total_clients > 0.1)) {
    events.push({
      type: 'at_risk_alert',
      weight: 70,
      data: { count: data.at_risk_clients, total: data.total_clients },
      source: 'snapshot',
    })
  }

  // low_occupancy_day: 3+ пустых окна
  if (data.empty_slots >= 3) {
    events.push({
      type: 'low_occupancy_day',
      weight: 60,
      data: { slots: data.empty_slots },
      source: 'snapshot',
    })
  }

  // low_retention: возвратность < 55%
  if (data.return_rate < 55 && data.total_clients > 0) {
    events.push({
      type: 'low_retention',
      weight: 50,
      data: { rate: data.return_rate },
      source: 'snapshot',
    })
  }

  return events
}

// ─── Event extraction from recent visits ─────────────────────────────────────

export function extractEventsFromVisits(visits: VisitRow[], avgCheck: number): ContentEvent[] {
  const events: ContentEvent[] = []
  if (visits.length === 0) return events

  // upsell_success: визит > avg_check * 1.5
  const upsells = visits.filter(v => v.amount && avgCheck > 0 && v.amount > avgCheck * 1.5)
  if (upsells.length > 0) {
    const top = upsells.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0]
    events.push({
      type: 'upsell_success',
      weight: 80,
      data: {
        amount: top.amount ?? 0,
        avg_check: avgCheck,
        service: top.service_name ?? '',
        master: top.master_name ?? '',
      },
      source: 'visits',
    })
  }

  // peak_day: 8+ визитов за один день
  const byDay = new Map<string, number>()
  for (const v of visits) {
    if (v.visit_date) {
      const day = v.visit_date.split('T')[0]
      byDay.set(day, (byDay.get(day) ?? 0) + 1)
    }
  }
  const maxDay = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0]
  if (maxDay && maxDay[1] >= 8) {
    events.push({
      type: 'peak_day',
      weight: 65,
      data: { date: maxDay[0], count: maxDay[1] },
      source: 'visits',
    })
  }

  return events
}

// ─── Event extraction from reviews ───────────────────────────────────────────

export function extractEventsFromReviews(reviews: ReviewRow[]): ContentEvent[] {
  const events: ContentEvent[] = []

  const negatives = reviews.filter(r => r.rating <= 3)
  if (negatives.length > 0) {
    events.push({
      type: 'negative_review',
      weight: 75,
      data: {
        count: negatives.length,
        latest_rating: negatives[0].rating,
        has_text: !!negatives[0].text,
      },
      source: 'reviews',
    })
  }

  return events
}

// ─── Seasonal event ───────────────────────────────────────────────────────────

export function extractSeasonalEvent(): ContentEvent {
  const month = new Date().getMonth()
  const seasonMap: Record<number, { season: string; signal: string; weight: number }> = {
    0:  { season: 'зима',  signal: 'сухой воздух от батарей и холод — покрытие ведёт себя иначе', weight: 30 },
    1:  { season: 'зима',  signal: 'февраль — частые трещины кутикулы из-за перепадов температур', weight: 30 },
    2:  { season: 'весна', signal: 'после зимы состояние ногтей у клиентов заметно хуже', weight: 35 },
    3:  { season: 'весна', signal: 'апрель — клиенты готовятся к открытию сезона обнажённых рук', weight: 35 },
    4:  { season: 'весна', signal: 'май — пик записей перед летом, покрытия с защитой SPF в тренде', weight: 40 },
    5:  { season: 'лето',  signal: 'море, хлорка и жара — покрытие держится меньше обычного', weight: 45 },
    6:  { season: 'лето',  signal: 'июль — расслоение ногтей от воды и солнца, клиенты жалуются', weight: 50 },
    7:  { season: 'лето',  signal: 'август — возвращаются после отпусков с повреждёнными ногтями', weight: 45 },
    8:  { season: 'осень', signal: 'сентябрь — кожа рук начинает сохнуть, кутикула грубеет', weight: 40 },
    9:  { season: 'осень', signal: 'октябрь — перчатки, батареи, пересушенность', weight: 35 },
    10: { season: 'осень', signal: 'ноябрь — готовимся к зимним покрытиям и уходу', weight: 30 },
    11: { season: 'зима',  signal: 'декабрь — предновогодний пик, клиенты хотят праздничные дизайны', weight: 55 },
  }

  const s = seasonMap[month]
  return {
    type: 'seasonal_pattern',
    weight: s.weight,
    data: { season: s.season, signal: s.signal, month },
    source: 'season',
  }
}

// ─── Select primary event ─────────────────────────────────────────────────────
// Всегда берём событие с наибольшим weight.

export function selectPrimaryEvent(events: ContentEvent[]): ContentEvent | null {
  if (events.length === 0) return null
  return events.sort((a, b) => b.weight - a.weight)[0]
}

// ─── Build system prompt for LLM ─────────────────────────────────────────────
// LLM получает ТОЛЬКО конкретное событие и данные для него.
// Никаких общих "напиши про маникюр".

export function buildContentPrompt(params: {
  event: ContentEvent
  contentType: ContentType
  salonType: string
  recentServices: string[]
  masterNames: string[]
  avgCheck: number
}): string {
  const { event, contentType, salonType, recentServices, masterNames, avgCheck } = params
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n/1000)} тыс ₽` : `${n} ₽`

  const eventContext: Record<EventType, string> = {
    upsell_success:
      `Произошло: одна из недавних процедур стоила ${fmt(event.data.amount as number)} при среднем чеке ${fmt(avgCheck)}. ` +
      `Услуга: "${event.data.service}". Мастер: ${event.data.master || 'не указан'}.`,
    at_risk_alert:
      `Произошло: ${event.data.count} клиентов не были уже 30–90 дней. ` +
      `Это ${Math.round((event.data.count as number) / (event.data.total as number) * 100)}% базы.`,
    low_occupancy_day:
      `Произошло: ${event.data.slots} пустых окон в расписании — необычно мало записей.`,
    negative_review:
      `Произошло: ${event.data.count} недавних отзыва с оценкой ≤ 3. Клиент был чем-то недоволен.`,
    peak_day:
      `Произошло: ${event.data.count} визитов за один день — один из самых насыщенных дней.`,
    seasonal_pattern:
      `Сигнал сезона (${event.data.season}): ${event.data.signal}.`,
    low_retention:
      `Произошло: возвратность клиентов ${event.data.rate}% — ниже нормы.`,
    client_returned:
      `Произошло: клиент вернулся после долгого перерыва.`,
    client_no_show:
      `Произошло: клиент не пришёл на запись.`,
    master_free_slots:
      `Произошло: у мастера неожиданно много свободных окон.`,
  }

  const contentTypeInstruction: Record<ContentType, string> = {
    observation:    'Напиши короткий пост — наблюдение от хозяйки или мастера. Что заметили. Без рекомендаций.',
    client_story:   'Напиши пост — анонимная история клиентки. Что пришла с чем, что вышло, что удивило. Без имён.',
    master_insight: 'Напиши пост от лица мастера — профессиональное наблюдение из работы. Не совет, а живая мысль.',
    warning:        'Напиши пост — предупреждение из реального опыта. Что видим в салоне, что нужно знать клиентам.',
    growth_insight: 'Напиши пост — честное наблюдение о том, что меняется. Без позитивной рекламы.',
    behind_scenes:  'Напиши пост про будни салона — что происходит за кулисами. Живой, не постановочный.',
  }

  return `Ты пишешь один пост для ${salonType}. Голос: хозяйка или мастер, разговорный стиль.

════════════════════════
СОБЫТИЕ (основа поста)
════════════════════════
${eventContext[event.type]}

Что делают в этом салоне: ${recentServices.slice(0, 5).join(', ') || 'маникюр, уход'}
${masterNames.length ? `Мастера: ${masterNames.join(', ')}` : ''}

════════════════════════
ЗАДАНИЕ
════════════════════════
${contentTypeInstruction[contentType]}

════════════════════════
ЖЁСТКИЕ ПРАВИЛА
════════════════════════
ЗАПРЕЩЕНО:
  ✗ маркетинговые формулы (AIDA, PAS, BAB)
  ✗ "Записывайтесь!" как рекламный призыв
  ✗ "Наши мастера — профессионалы"
  ✗ больше 2 эмодзи
  ✗ заголовки и структуры в тексте
  ✗ мотивационные фразы
  ✗ слова: трансформация, уникальный, лучший

ОБЯЗАТЕЛЬНО:
  ✓ разговорный тон, как рассказываешь знакомой
  ✓ одна конкретная ситуация — не общие слова
  ✓ "мы / я / у нас в салоне"
  ✓ 80–150 слов, не длиннее

ВОЗВРАЩАЙ ТОЛЬКО готовый текст поста. Без заголовков, без пометок, без markdown.`
}
