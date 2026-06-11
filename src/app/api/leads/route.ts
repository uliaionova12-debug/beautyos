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

    // SMS notification via SMS.ru
    const smsApiKey = process.env.SMSRU_API_KEY
    const smsRecipient = process.env.SMSRU_RECIPIENT
    if (smsApiKey && smsRecipient) {
      const contact = telegram?.trim() || phone?.trim() || '—'
      const smsText = `BeautyOS заявка: ${name.trim()}, ${contact}${business_type ? `, ${business_type.slice(0, 50)}` : ''}`
      const smsUrl = `https://sms.ru/sms/send?api_id=${smsApiKey}&to=${smsRecipient}&msg=${encodeURIComponent(smsText)}&json=1`
      fetch(smsUrl).catch(() => {})
    }

    // Telegram notification — works if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (botToken && chatId) {
      const contact = telegram?.trim() || phone?.trim() || '—'
      const text = `🌸 Новая заявка BeautyOS\n\n👤 ${name.trim()}\n📱 ${contact}${business_type ? `\n💬 ${business_type}` : ''}${plan ? `\n📋 ${plan}` : ''}`
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Lead save error:', err)
    // Still return success — don't block user if DB fails
    return NextResponse.json({ success: true })
  }
}
