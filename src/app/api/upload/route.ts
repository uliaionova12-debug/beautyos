export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseYClientsCSV } from '@/lib/csv-parser'
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

    // Парсим CSV
    const { rows, errors, totalRows, skippedRows } = await parseYClientsCSV(file)

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

    if (existingSalon) {
      salonId = existingSalon.id
      // Очищаем старые данные при повторной загрузке
      await supabaseAdmin.from('visits').delete().eq('salon_id', salonId)
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
    const visits = rows.map(row => ({
      salon_id: salonId,
      client_id: null, // упрощённо для MVP
      master_name: row.master_name,
      service_name: row.service_name,
      visit_date: row.visit_date,
      amount: parseFloat(row.amount.replace(/[^\d.]/g, '')) || 0,
    }))

    for (let i = 0; i < visits.length; i += 500) {
      await supabaseAdmin.from('visits').insert(visits.slice(i, i + 500))
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
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
