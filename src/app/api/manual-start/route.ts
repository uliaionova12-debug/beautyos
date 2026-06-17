export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runRetentionAnalysis } from '@/lib/retention-engine'
import { generateRetentionInsights } from '@/lib/claude'
import { CSVRow } from '@/types'

interface ManualClient {
  name: string
  phone?: string
  last_visit_date: string
  service_name?: string
  amount?: string
}

export async function POST(req: NextRequest) {
  try {
    const { salon_id: existingSalonId, salon_name, booking_url, clients } = await req.json() as {
      salon_id?: string
      salon_name?: string
      salon_type?: string
      booking_url?: string
      clients: ManualClient[]
    }

    const validClients = (clients || []).filter(c => c.name?.trim() && c.last_visit_date)

    if (validClients.length === 0) {
      return NextResponse.json({ error: 'Добавьте хотя бы одного клиента с именем и датой визита' }, { status: 400 })
    }

    let salonId: string

    if (existingSalonId) {
      // Use existing salon
      const { data: existing } = await supabaseAdmin
        .from('salons').select('id').eq('id', existingSalonId).single()
      if (!existing) {
        return NextResponse.json({ error: 'Салон не найден' }, { status: 404 })
      }
      salonId = existingSalonId
    } else {
      // Create new salon
      const salonInsert: Record<string, string> = { name: salon_name?.trim() || 'Мой кабинет', crm_type: 'manual' }
      if (booking_url?.trim()) salonInsert.booking_url = booking_url.trim()
      const { data: newSalon, error: salonErr } = await supabaseAdmin
        .from('salons')
        .insert(salonInsert)
        .select('id')
        .single()
      if (salonErr || !newSalon) {
        return NextResponse.json({ error: 'Не удалось создать профиль' }, { status: 500 })
      }
      salonId = newSalon.id
    }

    // Convert to CSVRow format for retention engine
    const rows: CSVRow[] = validClients.map(c => ({
      client_name: c.name.trim(),
      phone: c.phone?.trim() || '',
      visit_date: c.last_visit_date,
      master_name: '',
      service_name: c.service_name?.trim() || '',
      amount: c.amount?.toString() || '0',
    }))

    // Run retention analysis
    const { clients: analyzedClients, masters, summary } = runRetentionAnalysis({ salonId, rows })

    // Save clients
    if (analyzedClients.length > 0) {
      await supabaseAdmin.from('clients').insert(analyzedClients)
    }

    // Save masters (may be empty for solo practitioners)
    if (masters.length > 0) {
      await supabaseAdmin.from('masters').insert(masters)
    }

    // Save visits + data_upload record
    const dates = rows.map(r => r.visit_date).sort()
    const { data: uploadRecord } = await supabaseAdmin
      .from('data_uploads')
      .insert({
        salon_id: salonId,
        filename: 'manual',
        period_from: dates[0],
        period_to: dates[dates.length - 1],
        row_count: rows.length,
      })
      .select('id')
      .single()

    const visits = rows.map(row => ({
      salon_id: salonId,
      client_id: null,
      upload_id: uploadRecord?.id,
      master_name: row.master_name,
      service_name: row.service_name,
      visit_date: row.visit_date,
      amount: parseFloat(row.amount.replace(/[^\d.]/g, '')) || 0,
    }))
    await supabaseAdmin.from('visits').insert(visits)

    // AI insights (non-blocking)
    let aiResult = { insights: [] as string[], recommendation: '' }
    try {
      aiResult = await generateRetentionInsights(summary)
    } catch { /* continue without AI */ }
    summary.ai_insights = aiResult.insights
    summary.ai_recommendation = aiResult.recommendation

    // Save snapshot
    const totalRevenue = analyzedClients.reduce((s, c) => s + (c.total_revenue ?? 0), 0)
    await supabaseAdmin.from('analysis_snapshots').insert({
      salon_id: salonId,
      upload_id: uploadRecord?.id,
      total_clients: summary.total_clients,
      active_clients: summary.active_clients,
      at_risk_clients: summary.at_risk_clients,
      lost_clients: summary.lost_clients,
      total_revenue: totalRevenue,
      avg_check: analyzedClients.length > 0 ? Math.round(totalRevenue / analyzedClients.length) : 0,
      retention_rate: summary.retention_rate,
      total_financial_impact: summary.total_financial_impact,
    })

    // Save insight
    const atRiskTotal = summary.at_risk_clients + summary.lost_clients
    await supabaseAdmin.from('insights').insert({
      salon_id: salonId,
      agent_type: 'retention',
      title: `У Вас ${summary.total_clients} ${summary.total_clients === 1 ? 'клиент' : 'клиента'}`,
      body: aiResult.recommendation ||
        (atRiskTotal > 0
          ? `${atRiskTotal} клиент${atRiskTotal > 1 ? 'а' : ''} давно не возвращал${atRiskTotal > 1 ? 'и' : 'ся'}. Потенциал к возврату: ${summary.total_financial_impact.toLocaleString('ru')} ₽.`
          : 'Отличная возвратность! Продолжайте в том же духе.'),
      financial_impact: summary.total_financial_impact,
      priority: atRiskTotal > 2 ? 'warning' : 'info',
      action_label: 'Посмотреть список',
    })

    return NextResponse.json({ success: true, salon_id: salonId, summary })
  } catch (err) {
    console.error('Manual start error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
