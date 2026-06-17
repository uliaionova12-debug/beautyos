'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Copy, CheckCircle2, Zap, AlertTriangle, Star } from 'lucide-react'
import {
  buildSnapshot, getPrimaryActionId as getSnapshotPrimary, fmtMoney,
  type SummaryData,
} from '@/lib/ai-snapshot'

// ─── Types ───────────────────────────────────────────────────────────────────

// SummaryData imported from ai-snapshot — нет дублирующего Summary типа

interface MoneyBlock {
  potential: number
  clients: number
  returnPct: number
  timeframe: string
}

interface MessageGroup {
  platform: string
  texts: string[]
}

interface ExtraResult {
  perVisit: (s: SummaryData) => number
  checkLiftPct: number
  timeframe: string
}

interface ExecutionConfig {
  title: string
  why: string
  primaryReason: string
  layer: 'cash' | 'growth' | 'market'
  getMoneyBlock: (s: SummaryData) => MoneyBlock
  insight?: string
  stepsHeader?: string
  steps: string[]
  messages?: MessageGroup[]
  rules?: string[]
  extraResult?: ExtraResult
  ctaText: string
  ctaHref: (q: string) => string
}

// ─── Action names (for warning block) ────────────────────────────────────────

const ACTION_NAMES: Record<string, string> = {
  cash_at_risk:   'Написать клиентам, которые могут уйти',
  cash_lost:      'Вернуть ушедших клиентов личным сообщением',
  cash_slots:     'Заполнить пустые окна в расписании',
  growth_check:   'Поднять средний чек через дополнительные услуги',
  growth_freq:    'Увеличить частоту визитов активных клиентов',
  growth_ltv:     'Повысить системную возвратность клиентов',
  market_comp:    'Найти слабые стороны конкурентов',
  market_content: 'Создать контент, который приводит клиентов на запись',
  market_rep:     'Проверить репутацию и исправить слабые места',
}

// ─── Execution Configs ────────────────────────────────────────────────────────

const CONFIGS: Record<string, ExecutionConfig> = {

  // ══ CASH ═══════════════════════════════════════════════════════════════════

  cash_at_risk: {
    title: 'Написать клиентам, которые могут уйти',
    why: 'Эти клиенты ещё не ушли — один контакт сегодня возвращает 60% из них на запись',
    primaryReason: 'Самый высокий финансовый потенциал при минимальном усилии. Клиенты ещё активны — контакт сегодня даёт деньги завтра.',
    layer: 'cash',
    getMoneyBlock: (s) => ({ potential: s.at_risk_revenue, clients: s.at_risk_count, returnPct: 60, timeframe: 'сегодня–завтра' }),
    steps: [
      'Открыть список клиентов → отфильтровать "в зоне риска" (30–90 дней без визита)',
      'Выбрать 5–10 клиентов с самым высоким средним чеком — начать с них',
      'Скопировать один из готовых текстов ниже и отправить в WhatsApp или SMS',
      'Зафиксировать ответ и предложить конкретный день и время записи',
      'Добавить в расписание — не ждать "они сами запишутся"',
    ],
    messages: [
      {
        platform: 'WhatsApp / SMS',
        texts: [
          'Здравствуйте 🌿 Вы давно не были у нас — соскучились! Есть удобные окна на этой неделе. Хотите запишу вас?',
          'Привет! Давно вас не видели 😊 У нас есть свободное время в среду и пятницу. Будем рады вас видеть!',
          'Добрый день! Заметили, что давно не было вашего визита. Есть возможность записать вас на ближайшее время — удобно?',
        ],
      },
      {
        platform: 'Instagram DM',
        texts: [
          'Привет 👋 Соскучились по вам! Есть пара окон на эту неделю. Записать вас?',
          'Давно не было вашего визита 🌸 Хотели предложить удобное время — что скажете?',
        ],
      },
    ],
    ctaText: 'Открыть список клиентов',
    ctaHref: (q) => `/retention${q}`,
  },

  cash_lost: {
    title: 'Вернуть ушедших клиентов личным сообщением',
    why: 'Примерно 30% ушедших клиентов возвращаются при личном контакте — это самые дешёвые деньги',
    primaryReason: 'Большой объём ушедших клиентов создаёт высокий денежный потенциал даже при 30% возврате.',
    layer: 'cash',
    getMoneyBlock: (s) => ({ potential: Math.round(s.lost_count * s.avg_check * 0.30), clients: s.lost_count, returnPct: 30, timeframe: '1–3 дня' }),
    steps: [
      'Открыть список ушедших клиентов → отсортировать по дате последнего визита',
      'Выбрать тех, кто пришёл 3+ раза — они были лояльны, вернуть проще',
      'Написать персональное сообщение (не "рассылку") — упомянуть имя и услугу',
      'Предложить конкретное: "Есть окно в четверг" — не "приходите когда-нибудь"',
      'Подождать ответ 1 день; при молчании — второй контакт через неделю',
    ],
    messages: [
      {
        platform: 'WhatsApp / SMS',
        texts: [
          'Здравствуйте! Давно не видели вас — очень хотим снова видеть вас у нас 🌿 Есть удобное время на этой неделе. Записать вас?',
          'Добрый день! Помним вас и скучаем 😊 Хотели предложить удобное время для визита. Как насчёт [день]?',
          'Привет! Мы помним, как вам нравится [услуга] 🌸 Хотели предложить окошко — не хотите вернуться?',
        ],
      },
      {
        platform: 'Telegram',
        texts: [
          'Добрый день! Мы заметили, что вы давно не были у нас. Очень хотели бы вас видеть снова! Есть место в расписании — удобно в ближайшие дни?',
        ],
      },
    ],
    ctaText: 'Открыть ушедших клиентов',
    ctaHref: (q) => `/retention${q}`,
  },

  cash_slots: {
    title: 'Заполнить пустые окна в расписании',
    why: 'Каждый незаполненный час у мастера — это деньги, которые сгорят сегодня и не вернутся',
    primaryReason: 'Пустые окна сегодня — прямая потеря денег в течение часов. Самая срочная точка возврата.',
    layer: 'cash',
    getMoneyBlock: (s) => {
      const slots = Math.max(2, Math.round((1 - s.retention_rate / 100) * 6))
      return { potential: slots * s.avg_check, clients: slots, returnPct: 80, timeframe: 'сегодня' }
    },
    steps: [
      'Открыть расписание → найти незаполненные окна сегодня и завтра',
      'Взять список клиентов в зоне риска — они первые кандидаты на заполнение',
      'Написать сообщение с конкретным свободным временем (текст ниже)',
      'Не предлагать "когда удобно" — предложить 2–3 варианта времени',
      'Как только получен ответ — сразу создать запись, не откладывать',
    ],
    messages: [
      {
        platform: 'WhatsApp / SMS',
        texts: [
          'Здравствуйте! У нас освободилось удобное время сегодня в [время] и завтра в [время]. Хотите записаться?',
          'Добрый день! Есть окошко сегодня после [время] и в пятницу утром. Записать вас?',
          'Привет! Появилось свободное место на [день] в [время] — хотите занять? 🌿',
        ],
      },
    ],
    ctaText: 'Открыть расписание мастеров',
    ctaHref: (q) => `/master${q}`,
  },

  // ══ GROWTH ═════════════════════════════════════════════════════════════════

  growth_check: {
    title: 'Как увеличить чек уже сегодня',
    why: 'Вы работаете с клиентами, которые уже записаны — деньги уже внутри вашего салона',
    insight: 'Клиенты уже готовы платить больше — им просто не предложили',
    primaryReason: 'Большая база активных клиентов делает рост чека самым эффективным ростовым инструментом.',
    layer: 'growth',
    getMoneyBlock: (s) => ({ potential: Math.round(s.active_clients * s.avg_check * 0.15), clients: s.active_clients, returnPct: 50, timeframe: '7–14 дней' }),
    stepsHeader: 'Что делать прямо во время записи',
    steps: [
      'Определить услугу клиента — что он уже покупает прямо сейчас',
      'Найти логичное расширение — доп. услуга или upgrade к текущей',
      'Предложить во время визита — не заранее, не через переписку',
      'Зафиксировать в записи — добавить услугу сразу, не откладывать',
    ],
    messages: [
      {
        platform: 'Мягкий апсейл',
        texts: [
          '"Хотите, я добавлю ещё одну процедуру? Она хорошо сочетается с вашей услугой и даёт более длительный эффект."',
          '"Кстати, пока вы здесь — у нас есть [услуга], которая идеально подходит к тому, что вы делаете. Займёт 15 минут."',
        ],
      },
      {
        platform: 'Экспертный тон',
        texts: [
          '"Сейчас часто делают вместе с этой процедурой вот это — результат держится намного дольше. Хотите добавить?"',
          '"Как специалист рекомендую сочетать с [доп. услугой] — это даёт лучший результат, клиенты это замечают."',
        ],
      },
      {
        platform: 'Премиум апгрейд',
        texts: [
          '"Можем сделать чуть более усиленный вариант — он даёт более выраженный и долгосрочный эффект. Разница в цене небольшая."',
          '"У нас есть обновлённая версия этой процедуры — многие клиенты выбирают именно её, результат заметнее."',
        ],
      },
    ],
    rules: [
      'Предлагать только после того как понял запрос клиента — не вслепую',
      'Только во время живого контакта — не в переписке до визита',
      'Максимум одно дополнительное предложение за визит',
      'Если отказал — не настаивать, зафиксировать на следующий раз',
    ],
    extraResult: {
      perVisit: (s) => Math.round(s.avg_check * 0.15),
      checkLiftPct: 15,
      timeframe: '7–14 дней',
    },
    ctaText: 'Добавить в работу мастерам',
    ctaHref: (q) => `/master${q}`,
  },

  growth_freq: {
    title: 'Увеличить частоту визитов активных клиентов',
    why: 'Активный клиент, приходящий на 1 визит чаще в год — даёт столько же дохода, как 2 новых клиента',
    primaryReason: 'Высокая база активных клиентов даёт большой совокупный эффект даже от небольшого роста частоты.',
    layer: 'growth',
    getMoneyBlock: (s) => ({ potential: Math.round(s.active_clients * s.avg_check * 0.08), clients: s.active_clients, returnPct: 40, timeframe: '30 дней' }),
    steps: [
      'Определить среднюю частоту визитов для каждого сегмента клиентов',
      'Выявить клиентов, которые могут приходить чаще (срок между визитами > нормы)',
      'Настроить напоминание: за 5–7 дней до "ожидаемого" визита — контакт',
      'Предложить удобный следующий слот прямо во время текущего визита',
      'Если клиент не записался — триггер через 7 дней',
    ],
    messages: [
      {
        platform: 'WhatsApp (напоминание)',
        texts: [
          'Здравствуйте 🌿 Прошло [X] недель после вашего последнего визита. Самое время обновиться! Записать вас на следующей неделе?',
          'Привет! Пора к нам — прошло уже [X] недель 😊 Есть удобное время. Хотите запишу?',
        ],
      },
    ],
    ctaText: 'Посмотреть нагрузку мастеров',
    ctaHref: (q) => `/master${q}`,
  },

  growth_ltv: {
    title: 'Повысить системную возвратность клиентов',
    why: 'Рост возвратности на 5% увеличивает выручку до 25% без затрат на рекламу',
    primaryReason: 'Текущий уровень возвратности оставляет большое пространство для системного роста дохода.',
    layer: 'growth',
    getMoneyBlock: (s) => ({ potential: Math.round(s.avg_check * s.total_clients * 0.05), clients: s.total_clients, returnPct: 25, timeframe: '30–60 дней' }),
    steps: [
      'Проанализировать: у каких мастеров выше возвратность — перенять их подход',
      'Найти точки, после которых клиенты перестают возвращаться (2-й, 3-й визит)',
      'Настроить триггерные сообщения в каждой критической точке',
      'Внедрить "запись при записи" — мастер предлагает следующий слот прямо сейчас',
      'Замерить: % клиентов, записавшихся во время визита vs после',
    ],
    messages: [
      {
        platform: 'Скрипт завершения визита',
        texts: [
          '"Записать вас уже сейчас на следующий раз? Так вы точно получите удобное время и не забудете."',
          '"Когда вам будет удобно прийти снова? Давайте сразу зафиксируем — популярное время быстро занимается."',
        ],
      },
    ],
    ctaText: 'Открыть стратегию роста',
    ctaHref: (q) => `/ai-director${q}`,
  },

  // ══ MARKET ═════════════════════════════════════════════════════════════════

  market_comp: {
    title: 'Найти слабые стороны конкурентов',
    why: 'Зная где конкуренты теряют клиентов — вы точно знаете, что предложить и кому',
    primaryReason: 'Высокая конкурентная плотность в вашем районе делает анализ рынка стратегически первичным.',
    layer: 'market',
    getMoneyBlock: (s) => ({ potential: s.avg_check * 6, clients: 6, returnPct: 30, timeframe: '7–14 дней' }),
    steps: [
      'Найти 2–3 основных конкурента в вашем районе (2GIS, Яндекс, Instagram)',
      'Вставить ссылки на их страницы в анализатор',
      'Изучить слабые места: низкие оценки, жалобы в отзывах, пробелы в услугах',
      'Сформулировать ваше УТП: что вы делаете лучше — и как об этом рассказывать',
      'Использовать в контенте и при разговорах с новыми клиентами',
    ],
    ctaText: 'Открыть разбор конкурентов',
    ctaHref: (q) => `/competitors${q}`,
  },

  market_content: {
    title: 'Создать контент, который приводит клиентов на запись',
    why: 'Правильный пост конвертирует подписчика в запись — неправильный просто набирает лайки',
    primaryReason: 'Активная аудитория в соцсетях делает контент самым быстрым каналом привлечения.',
    layer: 'market',
    getMoneyBlock: (s) => ({ potential: s.avg_check * 4, clients: 4, returnPct: 20, timeframe: '7–30 дней' }),
    steps: [
      'Выбрать тему: результат процедуры / история клиента / ответ на возражение',
      'Написать пост по формуле: Боль → Решение → Результат → Призыв к записи',
      'Добавить конкретику: "После одной процедуры" / "За 45 минут" вместо "быстро"',
      'Фото/видео: показывать ДО/ПОСЛЕ, процесс, реакцию клиента',
      'Финал поста: конкретный призыв — "Запись по ссылке" / "Напишите мне"',
    ],
    messages: [
      {
        platform: 'Шаблон подписи поста',
        texts: [
          '📌 Запись: [ссылка] или напишите мне прямо сейчас — отвечу быстро!',
          '✨ Хотите такой же результат? Пишите в директ — подберём удобное время.',
          '👇 Ссылка на запись в описании профиля. Свободные окна на этой неделе ещё есть!',
        ],
      },
    ],
    ctaText: 'Открыть маркетинг',
    ctaHref: (q) => `/marketing${q}`,
  },

  market_rep: {
    title: 'Проверить репутацию и исправить слабые места',
    why: 'Новый клиент читает отзывы перед записью — один негативный без ответа = потеря нескольких клиентов',
    primaryReason: 'Репутация — первый барьер перед записью нового клиента. Низкий рейтинг блокирует весь входящий поток.',
    layer: 'market',
    getMoneyBlock: (s) => ({ potential: s.avg_check * 3, clients: 3, returnPct: 40, timeframe: '3–7 дней' }),
    steps: [
      'Проверить все площадки: 2GIS, Яндекс Карты, Google, ВКонтакте',
      'Ответить на все неотвеченные отзывы — особенно на негативные (спокойно)',
      'Попросить довольных клиентов оставить отзыв (шаблон ниже)',
      'Убедиться, что фото актуальные, контакты верные, часы работы правильные',
      'Настроить напоминание: раз в 2 недели проверять новые отзывы',
    ],
    messages: [
      {
        platform: 'Просьба об отзыве (WhatsApp)',
        texts: [
          'Здравствуйте! Рады, что визит прошёл хорошо 😊 Если вам не сложно — буду очень благодарна за отзыв на Яндекс Картах. Это очень помогает нам! [ссылка]',
          'Спасибо, что были у нас! Если понравилось — пожалуйста, оставьте отзыв. Это займёт 1 минуту и очень важно для нас 🌿 [ссылка]',
        ],
      },
    ],
    ctaText: 'Открыть анализ репутации',
    ctaHref: (q) => `/reputation${q}`,
  },
}

// ─── Layer styles ─────────────────────────────────────────────────────────────

const LAYER_STYLE = {
  cash:   { badge: 'bg-red-100 text-red-700',    border: 'border-l-red-400',   dot: '#f87171', label: 'Деньги сегодня' },
  growth: { badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-400', dot: '#fbbf24', label: 'Рост дохода' },
  market: { badge: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-400',  dot: '#60a5fa', label: 'Рынок' },
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-dusk/40 hover:text-sage transition-colors mt-0.5"
    >
      {copied
        ? <><CheckCircle2 size={11} className="text-sage" />Скопировано</>
        : <><Copy size={11} />Копировать</>
      }
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExecutionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const actionId = params.actionId as string
  const salonId = searchParams.get('salon_id') || ''
  const q = salonId ? `?salon_id=${salonId}` : ''

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [primaryId, setPrimaryId] = useState<string | null>(null)

  const config = CONFIGS[actionId]

  useEffect(() => {
    if (!salonId || !config) return
    fetch(`/api/summary?salon_id=${salonId}`)
      .then(r => r.json())
      .then((s: SummaryData) => {
        setSummary(s)
        setPrimaryId(getSnapshotPrimary(buildSnapshot(s)))
      })
      .catch(() => {})
  }, [salonId, config])

  if (!config) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-dusk mb-3">Действие не найдено</p>
          <Link href={`/actions${q}`} className="text-sage text-sm hover:opacity-80">← Вернуться к действиям</Link>
        </div>
      </div>
    )
  }

  const style = LAYER_STYLE[config.layer]
  const money = summary ? config.getMoneyBlock(summary) : null
  const isPrimary = salonId ? primaryId === actionId : false
  const isNotPrimary = salonId && primaryId !== null && primaryId !== actionId

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Nav */}
        <div className="flex items-center gap-3 mb-6 text-sm text-dusk">
          <Link href={`/actions${q}`} className="inline-flex items-center gap-1.5 hover:text-sage transition-colors">
            <ArrowLeft size={14} />
            Действия
          </Link>
          <span className="text-parchment">·</span>
          <Link href={`/dashboard${q}`} className="hover:text-sage transition-colors">Карта бизнеса</Link>
        </div>

        {/* ── WARNING: не primary ──────────────────────────────────── */}
        {isNotPrimary && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                  В вашем бизнесе сейчас важнее другое действие
                </p>
                <p className="text-sm text-graphite/80 leading-snug mb-3">
                  {ACTION_NAMES[primaryId!]}
                </p>
                <Link
                  href={`/execution/${primaryId}${q}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
                >
                  Перейти к главному действию
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Layer badge + PRIMARY badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${style.badge}`}>
            {style.label}
          </span>
          {isPrimary && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              <Star size={9} className="fill-amber-500 text-amber-500" />
              Приоритет №1
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-graphite leading-snug mb-3">{config.title}</h1>

        {/* WHY */}
        <div className={`border-l-2 pl-3 mb-5 ${style.border}`}>
          <p className="text-sm text-dusk/70 leading-relaxed">{config.why}</p>
        </div>

        {/* ── ПОЧЕМУ ЭТО №1 (только если primary) ────────────────── */}
        {isPrimary && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={12} className="text-amber-600" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Почему это сейчас №1</p>
            </div>
            <p className="text-sm text-graphite/80 leading-relaxed">{config.primaryReason}</p>
            <p className="text-xs text-amber-700/60 mt-2">
              Система выбрала это действие как главное — оно даёт максимальный финансовый эффект при минимальном усилии прямо сейчас.
            </p>
          </div>
        )}

        {/* Money Impact Block */}
        {money ? (
          <div className="bg-graphite rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={12} className="text-amber-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Финансовый эффект</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-emerald-400">{fmtMoney(money.potential)}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">потенциал</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{money.clients}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">клиентов</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{money.returnPct}%</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">вероятность</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/30">
                Ожидаемый результат:{' '}
                <span className="text-white/60 font-medium">{fmtMoney(Math.round(money.potential * money.returnPct / 100))}</span>
                {' '}за{' '}
                <span className="text-white/60 font-medium">{money.timeframe}</span>
              </p>
            </div>
          </div>
        ) : salonId ? (
          <div className="bg-graphite rounded-2xl p-5 mb-5 animate-pulse">
            <div className="h-3 bg-white/10 rounded w-1/3 mb-4" />
            <div className="grid grid-cols-3 gap-4"><div className="h-8 bg-white/10 rounded" /><div className="h-8 bg-white/10 rounded" /><div className="h-8 bg-white/10 rounded" /></div>
          </div>
        ) : null}

        {/* Insight */}
        {config.insight && (
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 mb-5">
            <span className="text-emerald-500 text-base shrink-0">💡</span>
            <p className="text-sm font-semibold text-emerald-800 leading-snug">{config.insight}</p>
          </div>
        )}

        {/* Execution Steps */}
        <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold text-dusk/40 uppercase tracking-widest mb-4">
            {config.stepsHeader ?? 'Что делать — по шагам'}
          </p>
          <ol className="space-y-3">
            {config.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: style.dot }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-graphite/80 leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Ready-to-use texts */}
        {config.messages && config.messages.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-dusk/40 uppercase tracking-widest mb-3 px-1">Готовые тексты — скопируйте и отправьте</p>
            <div className="space-y-3">
              {config.messages.map((group) => (
                <div key={group.platform} className="bg-card border border-parchment rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-parchment bg-parchment/30">
                    <p className="text-[11px] font-bold text-dusk/60 uppercase tracking-wider">{group.platform}</p>
                  </div>
                  <div className="divide-y divide-parchment/60">
                    {group.texts.map((text, i) => (
                      <div key={i} className="px-5 py-4 flex items-start justify-between gap-3">
                        <p className="text-sm text-graphite/80 leading-relaxed flex-1">{text}</p>
                        <CopyButton text={text} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rules — когда предлагать */}
        {config.rules && config.rules.length > 0 && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
            <p className="text-xs font-bold text-dusk/40 uppercase tracking-widest mb-4">Правила предложения</p>
            <ul className="space-y-2.5">
              {config.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-graphite/25 mt-[7px]" />
                  <p className="text-sm text-graphite/70 leading-snug">{rule}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Extra Result Block */}
        {config.extraResult && summary && (
          <div className="border border-sage/30 bg-sage/5 rounded-2xl p-5 mb-6">
            <p className="text-xs font-bold text-dusk/40 uppercase tracking-widest mb-4">Ожидаемый результат</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-graphite">+{fmtMoney(config.extraResult.perVisit(summary))}</p>
                <p className="text-[11px] text-dusk/50 mt-0.5 leading-snug">с каждого визита</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-graphite">+{config.extraResult.checkLiftPct}%</p>
                <p className="text-[11px] text-dusk/50 mt-0.5 leading-snug">к среднему чеку</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-graphite">{config.extraResult.timeframe}</p>
                <p className="text-[11px] text-dusk/50 mt-0.5 leading-snug">эффект заметен</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-sage/20">
              <p className="text-xs text-dusk/40">
                Совокупный прирост за 2 недели:{' '}
                <span className="font-bold text-sage">{fmtMoney(Math.round(config.extraResult.perVisit(summary) * summary.active_clients * 0.5))}</span>
                {' '}при 50% конверсии предложения
              </p>
            </div>
          </div>
        )}

        {/* CTA sticky */}
        <div className="sticky bottom-6">
          <Link
            href={config.ctaHref(q)}
            className="w-full flex items-center justify-center gap-2 bg-graphite text-white font-bold text-base rounded-2xl py-4 hover:bg-graphite/90 active:scale-95 transition-all shadow-lg shadow-graphite/20"
          >
            <Zap size={16} className="text-amber-400" />
            {config.ctaText}
            <ArrowRight size={18} />
          </Link>
        </div>

      </div>
    </div>
  )
}
