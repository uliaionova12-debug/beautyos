export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runRetentionAnalysis } from '@/lib/retention-engine'
import { generateRetentionInsights } from '@/lib/claude'
import { CSVRow } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rows, salon_name, salon_id: existingSalonId } = body as {
      rows: CSVRow[]
      salon_name: string
      salon_id?: string
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Нет данных для анализа' }, { status: 422 })
    }

    const salonName = salon_name || 'Мой салон'
    const uploadDates = rows.map(r => r.visit_date).sort()
    const periodFrom = uploadDates[0]
    const periodTo = uploadDates[uploadDates.length - 1]

    let salonId: string
    if (existingSalonId) {
      salonId = existingSalonId
    } else {
      const { data: found } = await supabaseAdmin.from('salons').select('id').eq('name', salonName).single()
      if (found) {
        salonId = found.id
      } else {
        const { data: created, error } = await supabaseAdmin.from('salons').insert({ name: salonName }).select('id').single()
        if (error || !created) return NextResponse.json({ error: 'Не удалось создать салон' }, { status: 500 })
        salonId = created.id
      }
    }

    await supabaseAdmin.from('visits').delete().eq('salon_id', salonId)
      .gte('visit_date', periodFrom).lte('visit_date', periodTo)
    await supabaseAdmin.from('clients').delete().eq('salon_id', salonId)
    await supabaseAdmin.from('masters').delete().eq('salon_id', salonId)
    await supabaseAdmin.from('insights').delete().eq('salon_id', salonId)

    const { clients, masters, summary } = runRetentionAnalysis({ salonId, rows })

    if (clients.length > 0) {
      const { error } = await supabaseAdmin.from('clients').insert(clients)
      if (error) throw error
    }
    if (masters.length > 0) {
      const { error } = await supabaseAdmin.from('masters').insert(masters)
      if (error) throw error
    }

    const visits = rows.map(row => ({
      salon_id: salonId,
      client_id: null,
      master_name: row.master_name,
      service_name: row.service_name,
      visit_date: row.visit_date,
      amount: parseFloat(String(row.amount).replace(/[^\d.]/g, '')) || 0,
    }))

    for (let i = 0; i < visits.length; i += 500) {
      const { error } = await supabaseAdmin.from('visits').insert(visits.slice(i, i + 500))
      if (error) throw error
    }

    let aiResult = { insights: [] as string[], recommendation: '' }
    try { aiResult = await generateRetentionInsights(summary) } catch { /* необязательно */ }
    summary.ai_insights = aiResult.insights
    summary.ai_recommendation = aiResult.recommendation

    await supabaseAdmin.from('insights').insert({
      salon_id: salonId, agent_type: 'retention',
      title: `Потеряно ${summary.lost_clients} клиентов`,
      body: aiResult.recommendation || `Потеряно ${summary.lost_clients} клиентов`,
      financial_impact: summary.total_financial_impact,
      priority: summary.lost_clients > 50 ? 'critical' : 'warning',
      action_label: 'Посмотреть список',
    })

    return NextResponse.json({
      success: true,
      salon_id: salonId,
      parsed: { totalRows: rows.length, analyzedRows: rows.length },
      summary,
    })
  } catch (err) {
    console.error('upload-dikidi-rows error:', err)
    const msg = err instanceof Error ? err.message : 'Внутренняя ошибка'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
