export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  const keyPresent = !!process.env.OPENAI_API_KEY

  if (!keyPresent) {
    return NextResponse.json({
      openai_configured: false,
      status: 'missing_key',
      model_tested: 'gpt-4o-mini',
      message: 'OPENAI_API_KEY is not set in environment variables',
    }, { status: 200 })
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'ping' }],
    })
    const replied = !!res.choices[0]?.message?.content

    return NextResponse.json({
      openai_configured: true,
      status: replied ? 'ok' : 'error',
      model_tested: 'gpt-4o-mini',
      message: replied ? 'OpenAI is reachable and responding' : 'Unexpected empty response from OpenAI',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({
      openai_configured: true,
      status: 'error',
      model_tested: 'gpt-4o-mini',
      message: `OpenAI call failed: ${msg}`,
    }, { status: 200 })
  }
}
