export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { directFromSummary, validateDirectorOutput, type ReputationInput } from '@/lib/director-core'
import { fmtMoney, type SummaryData } from '@/lib/ai-snapshot'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface Message { role: 'user' | 'assistant'; content: string }

const ACTION_NAMES: Record<string, string> = {
  cash_at_risk:   'Написать клиентам в зоне риска',
  cash_lost:      'Вернуть ушедших клиентов',
  cash_slots:     'Заполнить пустые окна в расписании',
  growth_check:   'Поднять средний чек через доп. услуги',
  growth_freq:    'Увеличить частоту визитов',
  growth_ltv:     'Повысить системную возвратность',
  market_comp:    'Найти слабые стороны конкурентов',
  market_content: 'Создать контент, который приводит на запись',
  market_rep:     'Настроить мониторинг репутации',
}

export async function POST(req: NextRequest) {
  const { messages, summary, reputation } = await req.json() as {
    messages: Message[]
    summary: SummaryData
    reputation?: ReputationInput
  }

  if (!summary?.total_clients) {
    return NextResponse.json({ message: 'INSUFFICIENT DATA — передайте summary салона' })
  }

  // ─ Director Core: детерминированное решение (никакого LLM здесь) ──────────
  const { snapshot, output } = directFromSummary(summary, reputation)

  // Validate (log only — don't block production)
  const errors = validateDirectorOutput(output, snapshot)
  if (errors.length > 0) {
    console.error('[DirectorCore] Validation errors:', errors)
  }

  // ─ Build system prompt: LLM получает готовый output, только форматирует ───
  const primaryScore = snapshot.derived.action_scores[output.primary_action_id]
  const secondaryBlock = output.secondary_action_ids.map((id, i) => {
    const sc = snapshot.derived.action_scores[id]
    return `${i + 2}. ${ACTION_NAMES[id]} — SCORE ${sc.final_score} | ${fmtMoney(sc.raw_money)}`
  }).join('\n')

  const system = `Ты — AI Director BeautyOS. Ты ТОЛЬКО форматируешь и объясняешь готовое решение. Ты НЕ вычисляешь приоритеты — они уже определены.

═══ DIRECTOR OUTPUT (deterministic, не изменяй) ═══
PRIMARY ACTION: ${ACTION_NAMES[output.primary_action_id]}
  FINAL_SCORE: ${primaryScore.final_score}
  raw_money:   ${fmtMoney(primaryScore.raw_money)}
  layer:       ${primaryScore.layer.toUpperCase()}

SECONDARY ACTIONS:
${secondaryBlock}

PRIMARY REASON (из данных): ${output.reasoning.primary_reason}

DATA POINTS USED:
${output.reasoning.data_points_used.map(d => `  • ${d}`).join('\n')}

WHY NOT OTHERS:
${output.reasoning.why_not_others.map(d => `  • ${d}`).join('\n')}

═══ BUSINESS SNAPSHOT ═══
cash.at_risk_clients:       ${snapshot.cash.at_risk_clients}
cash.at_risk_revenue:       ${fmtMoney(snapshot.cash.at_risk_revenue)}
cash.lost_clients:          ${snapshot.cash.lost_clients}
cash.lost_revenue_estimate: ${fmtMoney(snapshot.cash.lost_revenue_estimate)}
cash.empty_slots:           ${snapshot.cash.empty_slots}
growth.active_clients:      ${snapshot.growth.active_clients}
growth.avg_check:           ${fmtMoney(snapshot.growth.avg_check)}
growth.return_rate:         ${snapshot.growth.return_rate}%
derived.total_clients:      ${snapshot.derived.total_clients}
derived.total_revenue:      ${fmtMoney(snapshot.derived.total_revenue)}
reputation.has_sources:     ${snapshot.reputation.has_sources}
reputation.sources_count:   ${snapshot.reputation.sources_count}

═══ ТВОИ ПРАВИЛА ═══
- Форматируй Director Output в читаемый бриф (4 блока: PRIMARY / SECONDARY / INSIGHT / TODAY PLAN)
- НИКОГДА не меняй primary_action_id или порядок secondary
- НИКОГДА не придумывай клиентов, цифры или действия — только из snapshot выше
- НИКОГДА не используй маркетинговый язык: "усильте", "улучшите", "позиционирование"
- TODAY PLAN: 3 операционных шага из PRIMARY ACTION (без теории)
- BUSINESS STATE INSIGHT: одно наблюдение из данных. Формат: "Факт: [поле] = [значение] → [прямое следствие]"
- При follow-up вопросах — отвечай только из данных snapshot выше
- Язык: русский, обращение на «вы», тон директор→директор`

  const chatMessages = messages.length === 0
    ? [{ role: 'user' as const, content: 'Сформируй бриф.' }]
    : messages

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 700,
    temperature: 0.15,
    messages: [{ role: 'system', content: system }, ...chatMessages],
  })

  return NextResponse.json({
    message: response.choices[0].message.content?.trim() ?? '',
    director_output: output,           // клиент получает структурированный output
    validation_errors: errors,
  })
}
