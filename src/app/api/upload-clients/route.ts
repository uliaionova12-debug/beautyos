export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function daysSince(dateStr: string): number {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.floor((TODAY.getTime() - d.getTime()) / 86_400_000)
}

function calcStatus(days: number): { status: string; riskScore: number } {
  // > 90 дней — клиент потерян, уже выбрал другой салон
  const active = 30
  const lost = 90
  if (days > lost) return { status: 'lost', riskScore: 1.0 }
  if (days > active) return { status: 'at_risk', riskScore: parseFloat(((days - active) / (lost - active)).toFixed(3)) }
  return { status: 'active', riskScore: parseFloat((days / active).toFixed(3)) }
}

function parseDikidiClients(text: string) {
  const allLines = text.split('\n').filter(l => l.trim())
  if (!allLines.length) return []

  const sep = ';'
  const header = allLines[0].split(sep).map(h => h.trim())
  const minCols = header.length - 5

  // Пропускаем строки с меньше чем (ожидаемых - 5) колонок — это продолжения
  // многострочных полей Комментарий (нестандартный CSV без кавычек)
  const lines = allLines.filter((l, i) => i === 0 || l.split(sep).length >= minCols)

  const idx = (name: string) => header.findIndex(h => h.includes(name))
  const iName = idx('Имя клиента')
  const iLastName = idx('Фамилия клиента')
  const iPhone = idx('Мобильный')
  const iSpent = idx('Потрачено')
  const iAvg = idx('Средний чек')
  const iVisits = idx('Количество записей')
  const iLast = idx('Последний визит')
  const iBlacklist = idx('черном списке')

  const results = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep)
    const get = (ix: number) => (ix >= 0 && cols[ix] ? cols[ix].trim() : '')

    if (get(iBlacklist).toLowerCase() === 'да') continue

    const firstName = get(iName)
    const lastName = get(iLastName)
    const name = [firstName, lastName].filter(Boolean).join(' ') || get(iPhone)
    if (!name) continue

    const phone = get(iPhone).replace(/[^\d+]/g, '') || null
    const lastVisitRaw = get(iLast)  // DD.MM.YYYY
    const visits = parseInt(get(iVisits)) || 0
    const spent = parseFloat(get(iSpent).replace(',', '.')) || 0
    const avgCheck = parseFloat(get(iAvg).replace(',', '.')) || 0

    // Convert DD.MM.YYYY → YYYY-MM-DD
    let lastVisitDate: string | null = null
    if (lastVisitRaw && /\d{2}\.\d{2}\.\d{4}/.test(lastVisitRaw)) {
      const [d, m, y] = lastVisitRaw.split('.')
      lastVisitDate = `${y}-${m}-${d}`
    }

    if (visits === 0 || !lastVisitDate) continue

    const days = daysSince(lastVisitDate)
    const { status, riskScore } = calcStatus(days)

    // Revenue opportunity: avg_check * (365/30) * return_score
    const returnScore = status === 'active' ? 0.9 : status === 'at_risk' ? 0.5 : 0.2
    const revenueOpportunity = Math.round(avgCheck * (365 / 30) * returnScore)

    results.push({
      name,
      phone,
      last_visit_date: lastVisitDate,
      first_visit_date: null,
      total_visits: visits,
      total_revenue: Math.round(spent),
      avg_check: Math.round(avgCheck),
      avg_interval_days: 0,
      status,
      risk_score: riskScore,
      return_score: returnScore,
      revenue_opportunity: revenueOpportunity,
      days_since_last_visit: days,
      primary_master_name: null,
    })
  }

  return results
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const salonName = (formData.get('salon_name') as string) || 'Мой салон'

    if (!file) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
    }

    const text = await file.text()
    const clientRows = parseDikidiClients(text)

    if (clientRows.length === 0) {
      return NextResponse.json({ error: 'В файле не найдено клиентов' }, { status: 422 })
    }

    // Use existing salon_id if provided, otherwise create or find by name
    const existingSalonId = (formData.get('salon_id') as string) || ''
    let salonId: string
    if (existingSalonId) {
      salonId = existingSalonId
    } else {
      const { data: found } = await supabaseAdmin.from('salons').select('id').eq('name', salonName).single()
      if (found) {
        salonId = found.id
      } else {
        const { data: created, error } = await supabaseAdmin.from('salons').insert({ name: salonName }).select('id').single()
        if (error || !created) {
          return NextResponse.json({ error: 'Не удалось создать салон' }, { status: 500 })
        }
        salonId = created.id
      }
    }

    // Delete old clients for this salon (from client CSV uploads)
    await supabaseAdmin.from('clients').delete().eq('salon_id', salonId)

    const records = clientRows.map(c => ({ ...c, salon_id: salonId }))

    for (let i = 0; i < records.length; i += 500) {
      const { error } = await supabaseAdmin.from('clients').insert(records.slice(i, i + 500))
      if (error) throw error
    }

    const active = clientRows.filter(c => c.status === 'active').length
    const atRisk = clientRows.filter(c => c.status === 'at_risk').length
    const lost = clientRows.filter(c => c.status === 'lost').length
    const lostRevenue = clientRows
      .filter(c => c.status === 'lost')
      .reduce((s, c) => s + c.avg_check, 0)

    // Save insight
    try {
      await supabaseAdmin.from('insights').insert({
        salon_id: salonId,
        agent_type: 'retention',
        title: `Потеряно ${lost} клиентов`,
        body: `Из ${clientRows.length} клиентов ${lost} не возвращались более 75 дней. Потенциальный ущерб: ${lostRevenue.toLocaleString('ru-RU')} ₽ в месяц.`,
        financial_impact: lostRevenue,
        priority: lost > 500 ? 'critical' : lost > 100 ? 'warning' : 'info',
        action_label: 'Посмотреть список',
      })
    } catch { /* необязательно */ }

    return NextResponse.json({
      success: true,
      salon_id: salonId,
      summary: {
        total: clientRows.length,
        active,
        at_risk: atRisk,
        lost,
        lost_revenue_estimate: lostRevenue,
      },
    })
  } catch (err) {
    console.error('upload-clients error:', err)
    const msg = err instanceof Error ? err.message : 'Внутренняя ошибка сервера'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
