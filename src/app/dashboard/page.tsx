'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Upload, Share2, Copy, CheckCircle2, QrCode, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

interface Summary {
  salon_name?: string
  total_clients: number
  active_clients: number
  at_risk_count: number
  at_risk_revenue: number
  lost_count: number
  lost_impact: number
  avg_check: number
  total_revenue: number
  retention_rate: number
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteSlug, setInviteSlug] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

  function generateInviteLink() {
    setInviteSlug(salonId)
  }

  function inviteUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://beautyos-bice.vercel.app'
    return `${origin}/join?salon_id=${salonId}`
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteUrl())
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  useEffect(() => {
    if (!salonId) { setLoading(false); return }
    Promise.all([
      fetch(`/api/summary?salon_id=${salonId}`).then(r => r.json()),
      fetch(`/api/salon?id=${salonId}`).then(r => r.json()).catch(() => null),
    ])
      .then(([summaryData, salonData]) => {
        setSummary(summaryData)
        if (salonData?.salon_slug) setInviteSlug(salonData.salon_slug)
        else setInviteSlug(salonId) // fallback: use salonId directly
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [salonId])

  if (!salonId) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-dusk mb-4">Данные не загружены</p>
          <Link href="/join/salon" className="bg-sage text-white font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
            Загрузить данные
          </Link>
        </div>
      </div>
    )
  }

  const q = `?salon_id=${salonId}`

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-7">
          <Link
            href="/explain"
            className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors -ml-2 px-2 py-3 rounded-xl"
          >
            <ArrowLeft size={16} />
            Назад
          </Link>
          <Link
            href={`/join/salon${q}`}
            className="inline-flex items-center gap-1.5 text-xs text-dusk hover:text-sage transition-colors px-2 py-3 rounded-xl"
          >
            <Upload size={12} />
            Обновить данные
          </Link>
        </div>

        <div className="mb-7">
          <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-1.5">BeautyOS</p>
          <h1 className="text-2xl font-bold text-graphite">
            {summary?.salon_name || 'Карта бизнеса'}
          </h1>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card border border-parchment rounded-2xl p-6 h-32" />
            ))}
          </div>
        )}

        {/* 4 блока Карты бизнеса */}
        {!loading && summary && (
          <div className="space-y-3 mb-8">

            {/* 1. Финансовые потоки */}
            <div className="bg-card border border-parchment rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">💰</span>
                <div>
                  <p className="text-sm font-bold text-graphite">Финансовые потоки</p>
                  <p className="text-xs text-dusk/60">где формируется доход</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xl font-bold text-graphite">{formatMoney(summary.avg_check)}</p>
                  <p className="text-[11px] text-dusk/60 mt-0.5">средний чек</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-600">{formatMoney(summary.at_risk_revenue)}</p>
                  <p className="text-[11px] text-dusk/60 mt-0.5">можно вернуть</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-500">−{formatMoney(summary.lost_impact)}</p>
                  <p className="text-[11px] text-dusk/60 mt-0.5">потери</p>
                </div>
              </div>
            </div>

            {/* 2. Клиенты */}
            <div className="bg-card border border-parchment rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">👥</span>
                <div>
                  <p className="text-sm font-bold text-graphite">Клиенты</p>
                  <p className="text-xs text-dusk/60">кто возвращается / не возвращается</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: summary.total_clients, label: 'всего', color: 'text-graphite' },
                  { val: summary.active_clients, label: 'активных', color: 'text-emerald-600' },
                  { val: summary.at_risk_count, label: 'в риске', color: 'text-amber-600' },
                  { val: summary.lost_count, label: 'потеряно', color: 'text-red-500' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className={`text-xl font-bold ${m.color}`}>{m.val}</p>
                    <p className="text-[10px] text-dusk/50 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Дефициты */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📉</span>
                <div>
                  <p className="text-sm font-bold text-graphite">Дефициты</p>
                  <p className="text-xs text-dusk/60">где теряется потенциал</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xl font-bold text-red-600">{summary.lost_count}</p>
                  <p className="text-[11px] text-dusk/60 mt-0.5">потерянных</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">−{formatMoney(summary.lost_impact)}</p>
                  <p className="text-[11px] text-dusk/60 mt-0.5">финансовый ущерб</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">{100 - summary.retention_rate}%</p>
                  <p className="text-[11px] text-dusk/60 mt-0.5">уходят</p>
                </div>
              </div>
            </div>

            {/* 4. Точки роста */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📈</span>
                <div>
                  <p className="text-sm font-bold text-graphite">Точки роста</p>
                  <p className="text-xs text-dusk/60">зоны увеличения дохода</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-bold text-emerald-700">{summary.at_risk_count}</p>
                  <p className="text-xs text-dusk/60 mt-0.5">клиентов можно вернуть</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-700">{formatMoney(summary.at_risk_revenue)}</p>
                  <p className="text-xs text-dusk/60 mt-0.5">потенциал выручки</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* CTA — Перейти к действиям */}
        {!loading && summary && (
          <Link
            href={`/actions${q}`}
            className="w-full flex items-center justify-center gap-2 bg-graphite text-white font-semibold text-base rounded-2xl py-4 hover:bg-graphite/90 active:scale-95 transition-all shadow-md shadow-graphite/10 mb-6"
          >
            <Sparkles size={16} className="opacity-60" />
            Перейти к действиям
            <ArrowRight size={18} />
          </Link>
        )}

        {/* Invite link */}
        {!loading && salonId && (
          <div className="bg-card border border-parchment rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Share2 size={15} className="text-terracotta" />
              <p className="text-sm font-semibold text-graphite">Ссылка для клиентов</p>
            </div>
            <p className="text-xs text-dusk leading-relaxed mb-4">
              Отправьте ссылку — клиент попадает прямо к вам. Больше повторных визитов без затрат на рекламу.
            </p>

            {salonId ? (
              <div className="space-y-3">
                {/* Link row */}
                <div className="flex items-center gap-2 bg-parchment/60 rounded-xl px-3 py-2.5 border border-parchment">
                  <code className="text-xs text-graphite/70 flex-1 truncate">
                    {inviteUrl()}
                  </code>
                  <button onClick={copyInviteLink} className="shrink-0 text-dusk/50 hover:text-graphite transition-colors">
                    {inviteCopied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={copyInviteLink}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-terracotta text-white rounded-xl py-2.5 hover:bg-terracotta/90 transition-colors"
                  >
                    {inviteCopied ? <><CheckCircle2 size={12} />Скопировано</> : <><Copy size={12} />Скопировать</>}
                  </button>
                  <button
                    onClick={() => setShowQr(v => !v)}
                    className={`flex items-center justify-center gap-1.5 text-xs font-semibold border rounded-xl px-4 py-2.5 transition-colors ${
                      showQr
                        ? 'bg-terracotta/10 border-terracotta/40 text-terracotta'
                        : 'border-parchment text-graphite/70 hover:border-terracotta/40'
                    }`}
                  >
                    <QrCode size={12} />
                    QR-код
                  </button>
                </div>

                {/* QR code */}
                {showQr && (
                  <div className="flex flex-col items-center gap-3 bg-white border border-parchment rounded-2xl py-6 px-4">
                    <QRCodeSVG
                      value={inviteUrl()}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#2d2d2d"
                      level="M"
                    />
                    <p className="text-xs text-dusk text-center leading-relaxed">
                      Покажите клиенту — он сканирует и попадает на страницу входа
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

      </div>
    </div>
  )
}
