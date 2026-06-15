export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseDikidiXLS } from '@/lib/dikidi-parser'
import { runRetentionAnalysis } from '@/lib/retention-engine'
import { generateRetentionInsights } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const salonName = (formData.get('salon_name') as string) || 'Мой салон'

    if (!file) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
    }

    const { rows, errors, totalRows, skippedRows } = await parseDikidiXLS(file)

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 422 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'В файле нет данных для анализа' }, { status: 422 })
    }

    // Ищем или создаём салон
    let salonId: string
    const { data: existingSalon } = await supabaseAdmin
      .from('salons')
      .select('id')
      .eq('name', salonName)
      .single()

    const uploadDates = rows.map(r => r.visit_date).sort()
    const periodFrom = uploadDates[0]
    const periodTo = uploadDates[uploadDates.length - 1]

    if (existingSalon) {
      salonId = existingSalon.id
      await supabaseAdmin.from('visits').delete().eq('salon_id', salonId)
        .gte('visit_date', periodFrom).lte('visit_date', periodTo)
      await supabaseAdmin.from('clients').delete().eq('salon_id', salonId)
      await supabaseAdmin.from('masters').delete().eq('salon_id', salonId)
      await supabaseAdmin.from('insights').delete().eq('salon_id', salonId)
    } else {
      const { data: newSalon, error } = await supabaseAdmin
        .from('salons').insert({ name: salonName }).select('id').single()
      if (error || !newSalon) {
        return NextResponse.json({ error: 'Не удалось создать салон' }, { status: 500 })
      }
      salonId = newSalon.id
    }

    let uploadId: string | undefined
    try {
      const { data: uploadRecord } = await supabaseAdmin
        .from('data_uploads')
        .insert({ salon_id: salonId, filename: file.name, period_from: periodFrom, period_to: periodTo, row_count: rows.length })
        .select('id').single()
      uploadId = uploadRecord?.id
    } catch { /* таблица необязательна */ }

    const { clients, masters, summary } = runRetentionAnalysis({ salonId, rows })

    if (clients.length > 0) {
      const { error } = await supabaseAdmin.from('clients').insert(clients)
      if (error) throw error
    }

    if (masters.length > 0) {
      const { error } = await supabaseAdmin.from('masters').insert(masters)
      if (error) throw error
    }

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

    let aiResult = { insights: [] as string[], recommendation: '' }
    try {
      aiResult = await generateRetentionInsights(summary)
    } catch { /* AI необязателен */ }

    summary.ai_insights = aiResult.insights
    summary.ai_recommendation = aiResult.recommendation

    try {
      const totalRevenue = clients.reduce((s, c) => s + (c.total_revenue ?? 0), 0)
      const avgCheck = clients.length > 0 ? Math.round(totalRevenue / clients.length) : 0
      await supabaseAdmin.from('analysis_snapshots').insert({
        salon_id: salonId, upload_id: uploadId,
        total_clients: summary.total_clients, active_clients: summary.active_clients,
        at_risk_clients: summary.at_risk_clients, lost_clients: summary.lost_clients,
        total_revenue: totalRevenue, avg_check: avgCheck,
        retention_rate: summary.retention_rate, total_financial_impact: summary.total_financial_impact,
      })
    } catch { /* необязательно */ }

    await supabaseAdmin.from('insights').insert({
      salon_id: salonId, agent_type: 'retention',
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
    console.error('Upload-dikidi error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера', detail }, { status: 500 })
  }
}
