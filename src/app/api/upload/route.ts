export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseYClientsCSV } from '@/lib/csv-parser'
import { runRetentionAnalysis } from '@/lib/retention-engine'
import { generateRetentionInsights } from '@/lib/claude'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function daysSince(dateStr: string): number {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.floor((TODAY.getTime() - d.getTime()) / 86_400_000)
}

function parseDikidiClients(text: string) {
  const allLines = text.split('\n').filter(l => l.trim())
  if (!allLines.length) return []
  const sep = ';'
  const header = allLines[0].split(sep).map(h => h.trim())
  const minCols = header.length - 5
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
    const name = [get(iName), get(iLastName)].filter(Boolean).join(' ') || get(iPhone)
    if (!name) continue
    const phone = get(iPhone).replace(/[^\d+]/g, '') || null
    const lastVisitRaw = get(iLast)
    const visits = parseInt(get(iVisits)) || 0
    const spent = parseFloat(get(iSpent).replace(',', '.')) || 0
    const avgCheck = parseFloat(get(iAvg).replace(',', '.')) || 0
    let lastVisitDate: string | null = null
    if (lastVisitRaw && /\d{2}\.\d{2}\.\d{4}/.test(lastVisitRaw)) {
      const [d, m, y] = lastVisitRaw.split('.')
      lastVisitDate = `${y}-${m}-${d}`
    }
    if (visits === 0 || !lastVisitDate) continue
    const days = daysSince(lastVisitDate)
    const status = days > 90 ? 'lost' : days > 30 ? 'at_risk' : 'active'
    const riskScore = status === 'lost' ? 1.0 : status === 'at_risk' ? parseFloat(((days - 30) / 60).toFixed(3)) : parseFloat((days / 30).toFixed(3))
    const returnScore = status === 'active' ? 0.9 : status === 'at_risk' ? 0.5 : 0.2
    results.push({ name, phone, last_visit_date: lastVisitDate, first_visit_date: null, total_visits: visits, total_revenue: Math.round(spent), avg_check: Math.round(avgCheck), avg_interval_days: 0, status, risk_score: riskScore, return_score: returnScore, revenue_opportunity: Math.round(avgCheck * (365 / 30) * returnScore), days_since_last_visit: days, primary_master_name: null })
  }
  return results
}

async function handleDikidiClientsUpload(text: string, salonName: string, existingSalonId: string) {
  const clientRows = parseDikidiClients(text)
  if (clientRows.length === 0) {
    return NextResponse.json({ error: 'В файле не найдено клиентов с датой визита' }, { status: 422 })
  }
  let salonId = existingSalonId
  if (!salonId) {
    const { data: found } = await supabaseAdmin.from('salons').select('id').eq('name', salonName).single()
    if (found) { salonId = found.id }
    else {
      const { data: created, error } = await supabaseAdmin.from('salons').insert({ name: salonName }).select('id').single()
      if (error || !created) return NextResponse.json({ error: 'Не удалось создать салон' }, { status: 500 })
      salonId = created.id
    }
  }
  await supabaseAdmin.from('clients').delete().eq('salon_id', salonId)
  const records = clientRows.map(c => ({ ...c, salon_id: salonId }))
  for (let i = 0; i < records.length; i += 500) {
    const { error } = await supabaseAdmin.from('clients').insert(records.slice(i, i + 500))
    if (error) throw error
  }
  const atRisk = clientRows.filter(c => c.status === 'at_risk').length
  const lost = clientRows.filter(c => c.status === 'lost').length
  const lostRevenue = clientRows.filter(c => c.status === 'lost').reduce((s, c) => s + c.avg_check, 0)
  try {
    await supabaseAdmin.from('insights').delete().eq('salon_id', salonId).eq('agent_type', 'retention')
    await supabaseAdmin.from('insights').insert({ salon_id: salonId, agent_type: 'retention', title: `Позвоните ${atRisk} клиентам сегодня`, body: `Из ${clientRows.length} клиентов ${atRisk} не были 30–90 дней — они ещё вернутся. ${lost} потеряны (90+ дней).`, financial_impact: lostRevenue, priority: atRisk > 50 ? 'critical' : 'warning', action_label: 'Посмотреть список' })
  } catch { /* необязательно */ }
  return NextResponse.json({ success: true, salon_id: salonId, summary: { total: clientRows.length, at_risk: atRisk, lost, lost_revenue_estimate: lostRevenue } })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const salonName = (formData.get('salon_name') as string) || 'Мой салон'
    const existingSalonId = (formData.get('salon_id') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
    }

    // Auto-detect Dikidi clients CSV by checking first line for 'Последний визит'
    const text = await file.text()
    const firstLine = text.split('\n')[0] || ''
    if (firstLine.includes(';') && firstLine.includes('визит')) {
      return await handleDikidiClientsUpload(text, salonName, existingSalonId)
    }

    // Парсим CSV
    const fileObj = new File([text], file.name, { type: file.type })
    const { rows, errors, totalRows, skippedRows } = await parseYClientsCSV(fileObj)

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0], details: errors }, { status: 422 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'В файле нет данных для анализа' }, { status: 422 })
    }

    // Создаём или находим салон (для демо используем один общий)
    let salonId: string
    const { data: existingSalon } = await supabaseAdmin
      .from('salons')
      .select('id')
      .eq('name', salonName)
      .single()

    // Определяем период загружаемых данных
    const uploadDates = rows.map(r => r.visit_date).sort()
    const periodFrom = uploadDates[0]
    const periodTo = uploadDates[uploadDates.length - 1]

    if (existingSalon) {
      salonId = existingSalon.id
      // Заменяем только визиты в диапазоне загружаемого файла — старая история сохраняется
      await supabaseAdmin.from('visits')
        .delete()
        .eq('salon_id', salonId)
        .gte('visit_date', periodFrom)
        .lte('visit_date', periodTo)
      // Агрегаты и инсайты пересчитываются полностью
      await supabaseAdmin.from('clients').delete().eq('salon_id', salonId)
      await supabaseAdmin.from('masters').delete().eq('salon_id', salonId)
      await supabaseAdmin.from('insights').delete().eq('salon_id', salonId)
    } else {
      const { data: newSalon, error } = await supabaseAdmin
        .from('salons')
        .insert({ name: salonName })
        .select('id')
        .single()

      if (error || !newSalon) {
        return NextResponse.json({ error: 'Не удалось создать салон' }, { status: 500 })
      }
      salonId = newSalon.id
    }

    // Регистрируем загрузку в журнале (Salon Memory — необязательно)
    let uploadId: string | undefined
    try {
      const { data: uploadRecord } = await supabaseAdmin
        .from('data_uploads')
        .insert({ salon_id: salonId, filename: file.name, period_from: periodFrom, period_to: periodTo, row_count: rows.length })
        .select('id')
        .single()
      uploadId = uploadRecord?.id
    } catch {
      // Таблица data_uploads ещё не создана — продолжаем без журнала
    }

    // Запускаем анализ
    const { clients, masters, summary } = runRetentionAnalysis({ salonId, rows })

    // Сохраняем клиентов
    if (clients.length > 0) {
      const { error } = await supabaseAdmin.from('clients').insert(clients)
      if (error) throw error
    }

    // Сохраняем мастеров
    if (masters.length > 0) {
      const { error } = await supabaseAdmin.from('masters').insert(masters)
      if (error) throw error
    }

    // Сохраняем визиты (батчами по 500)
    const visits = rows.map(row => {
      const v: Record<string, unknown> = {
        salon_id: salonId,
        client_id: null,
        master_name: row.master_name,
        service_name: row.service_name,
        visit_date: row.visit_date,
        amount: parseFloat(String(row.amount).replace(/[^\d.]/g, '')) || 0,
      }
      if (uploadId) v.upload_id = uploadId
      return v
    })

    for (let i = 0; i < visits.length; i += 500) {
      const { error } = await supabaseAdmin.from('visits').insert(visits.slice(i, i + 500))
      if (error) throw error
    }

    // Получаем AI-инсайты
    let aiResult = { insights: [] as string[], recommendation: '' }
    try {
      aiResult = await generateRetentionInsights(summary)
    } catch {
      // AI недоступен — продолжаем без инсайтов
    }

    summary.ai_insights = aiResult.insights
    summary.ai_recommendation = aiResult.recommendation

    // Сохраняем снапшот метрик (Salon Memory — необязательно)
    try {
      const totalRevenue = clients.reduce((s, c) => s + (c.total_revenue ?? 0), 0)
      const avgCheck = clients.length > 0 ? Math.round(totalRevenue / clients.length) : 0
      await supabaseAdmin.from('analysis_snapshots').insert({
        salon_id: salonId,
        upload_id: uploadId,
        total_clients: summary.total_clients,
        active_clients: summary.active_clients,
        at_risk_clients: summary.at_risk_clients,
        lost_clients: summary.lost_clients,
        total_revenue: totalRevenue,
        avg_check: avgCheck,
        retention_rate: summary.retention_rate,
        total_financial_impact: summary.total_financial_impact,
      })
    } catch {
      // Таблица analysis_snapshots ещё не создана — продолжаем
    }

    // Сохраняем главный инсайт
    await supabaseAdmin.from('insights').insert({
      salon_id: salonId,
      agent_type: 'retention',
      title: `Потеряно ${summary.lost_clients} клиентов`,
      body: aiResult.recommendation || `За последние 90 дней потеряно ${summary.lost_clients} клиентов`,
      financial_impact: summary.total_financial_impact,
      priority: summary.lost_clients > 50 ? 'critical' : summary.lost_clients > 20 ? 'warning' : 'info',
      action_label: 'Посмотреть список',
    })

    return NextResponse.json({
      success: true,
      salon_id: salonId,
      parsed: { totalRows, skippedRows, analyzedRows: rows.length },
      summary,
    })
  } catch (err) {
    const detail = err instanceof Error
      ? { message: err.message, stack: err.stack?.slice(0, 300) }
      : JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err as object)))
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера', detail }, { status: 500 })
  }
}
