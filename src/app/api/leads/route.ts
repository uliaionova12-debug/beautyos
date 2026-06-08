export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, telegram, business_type, plan } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Введите имя' }, { status: 400 })
    }

    await supabaseAdmin.from('leads').insert({
      name: name.trim(),
      phone: phone?.trim() || null,
      telegram: telegram?.trim() || null,
      business_type: business_type || null,
      plan: plan || null,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Lead save error:', err)
    // Still return success — don't block user if DB fails
    return NextResponse.json({ success: true })
  }
}
