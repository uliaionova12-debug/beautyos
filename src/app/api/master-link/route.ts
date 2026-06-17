export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { name, salon_id } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Введите ваше имя' }, { status: 400 })
    }

    let salonId = salon_id

    if (!salonId) {
      const { data: newSalon, error } = await supabaseAdmin
        .from('salons')
        .insert({ name: `Кабинет ${name.trim()}`, crm_type: 'manual' })
        .select('id')
        .single()

      if (error || !newSalon) {
        return NextResponse.json({ error: 'Не удалось создать кабинет' }, { status: 500 })
      }
      salonId = newSalon.id
    }

    const { data: master, error: masterError } = await supabaseAdmin
      .from('masters')
      .insert({
        salon_id: salonId,
        name: name.trim(),
        total_clients: 0,
        active_clients_count: 0,
        at_risk_clients_count: 0,
        lost_clients_count: 0,
        total_revenue: 0,
        avg_check: 0,
        retention_rate: 0,
        risk_score: 0,
      })
      .select('id')
      .single()

    if (masterError || !master) {
      return NextResponse.json({ error: 'Не удалось создать профиль мастера' }, { status: 500 })
    }

    return NextResponse.json({ salon_id: salonId, master_id: master.id })
  } catch (err) {
    console.error('master-link error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
