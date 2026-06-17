export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const MONTH_NAMES = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']
const MONTH_NAMES_R = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

function currentMonth() { return new Date().getMonth() }

// Detect salon type from top services
function detectSalonType(services: { name: string; count: number }[]): 'nail' | 'hair' | 'brow' | 'lash' | 'skin' | 'general' {
  const names = services.map(s => s.name.toLowerCase()).join(' ')
  if (/маникюр|педикюр|гель.лак|ногт|наращ|покрыт/.test(names)) return 'nail'
  if (/брови|brow|оформл.*бров/.test(names)) return 'brow'
  if (/ресниц|lash|наращ.*ресн/.test(names)) return 'lash'
  if (/чистк.*лиц|пилинг|уход.*лиц|косметолог/.test(names)) return 'skin'
  if (/стрижк|окрас|балаяж|укладк|волос/.test(names)) return 'hair'
  return 'general'
}

interface ServiceStat { name: string; count: number }

function generatePosts(data: {
  atRisk: number
  lost: number
  total: number
  active: number
  avgCheck: number
  topServices: ServiceStat[]
  atRiskRevenue: number
  salonType: 'nail' | 'hair' | 'brow' | 'lash' | 'skin' | 'general'
}) {
  const m = currentMonth()
  const monthName = MONTH_NAMES[m]
  const monthNameR = MONTH_NAMES_R[m]
  const isSummer = m >= 5 && m <= 7
  const returnPct = data.atRisk > 0 ? Math.round((data.atRisk / data.total) * 100) : 9

  const top1 = data.topServices[0]?.name || null
  const top2 = data.topServices[1]?.name || null
  const top3 = data.topServices[2]?.name || null
  const topCount = data.topServices[0]?.count || 0

  // Service-specific content map
  const seasonal: Record<string, { title: string; text: string; insight: string; careTitle: string; careTips: string }> = {
    nail: {
      title: isSummer ? 'Летний маникюр — яркие ногти под сандалии' : `Ногти в ${monthNameR}: идеальный вид`,
      text: isSummer
        ? `☀️ Лето — время педикюра и ярких оттенков! Коралл, неон, французский педикюр — всё это уже ждёт вас.\n${top1 ? `\n💅 "${top1}" — самая популярная услуга у наших клиентов этим летом.` : ''}\n\nЗапишитесь сейчас — свободные окна разбирают быстро! Первые 5 записей — бонус дизайн в подарок 🎁`
        : `💅 ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} — время обновить образ!${top1 ? ` "${top1}"` : ' Маникюр и педикюр'} с нашими мастерами — это уход + красота в одном визите.`,
      insight: isSummer
        ? 'Лето = пик педикюра. Клиенты обновляют покрытие чаще — каждые 3–4 недели. Идеальное время для рассылки.'
        : `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}: сезонный спрос на уход за ногтями вырастает на 20–30%.`,
      careTitle: isSummer ? 'Как сохранить маникюр всё лето' : 'Уход за ногтями между визитами',
      careTips: isSummer
        ? `💅 3 правила летнего маникюра:\n1) Наносите SPF-крем на руки — УФ обесцвечивает покрытие\n2) Надевайте перчатки при контакте с хлором в бассейне\n3) После моря увлажняйте кутикулу маслом\n\nСохраняй и приходи — подберём стойкое летнее покрытие 💛`
        : `✨ Как продлить маникюр дольше:\n1) Не мочите ногти первые 2 часа после нанесения\n2) Надевайте перчатки при мытье посуды\n3) Ежедневно смазывайте кутикулу маслом\n\nВопросы — пишите в директ!`,
    },
    brow: {
      title: isSummer ? 'Брови без макияжа — тренд лета 2026' : `Идеальные брови в ${monthNameR}`,
      text: isSummer
        ? `🌿 Лето — и вы прекрасны без лишнего макияжа. Ухоженные брови говорят сами за себя.${top1 ? `\n\n"${top1}" — самая востребованная процедура у нас.` : ''}\n\nЗапишитесь сейчас — свободных окон немного 🗓️`
        : `✨ ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}: обновите форму бровей. ${top1 || 'Коррекция и окрашивание'} — и ваш взгляд говорит больше слов.`,
      insight: `Брови — экспресс-процедура 30–45 минут, но отдача максимальная. Клиенты возвращаются каждые 4–6 недель.`,
      careTitle: isSummer ? 'Как сохранить форму бровей летом' : 'Уход за бровями дома',
      careTips: `✨ 3 правила ухоженных бровей:\n1) Расчёсывайте спулером каждое утро\n2) Используйте масло для роста\n3) Не трогайте "лишние" волоски сами — приходите к нам\n\nСохраняй 💛`,
    },
    lash: {
      title: isSummer ? 'Ресницы без туши — свобода этим летом' : `Красивые ресницы в ${monthNameR}`,
      text: isSummer
        ? `🌊 Море, бассейн, жара — а ресницы всё равно идеальные! Наращивание от наших мастеров держится до 4 недель.${top1 ? `\n\n"${top1}" — выбор большинства наших клиенток.` : ''}\n\nЗапишитесь на летский комплекс 🎁`
        : `✨ ${top1 || 'Наращивание ресниц'} — просыпайтесь красивой каждый день.`,
      insight: `Летом клиентки отдают предпочтение водостойким техникам. Это пик сезона для лешмейкеров.`,
      careTitle: isSummer ? 'Как сохранить ресницы на отдыхе' : 'Уход за наращёнными ресницами',
      careTips: `🌊 3 правила для ресниц летом:\n1) Избегайте масляных средств вокруг глаз\n2) Не трите глаза полотенцем — промакивайте\n3) Расчёсывайте щёточкой после купания\n\nСохраняй и приходи 💛`,
    },
    general: {
      title: isSummer ? `Лучшее лето начинается с ухода за собой` : `Обновление в ${monthNameR}`,
      text: isSummer
        ? `☀️ Этим летом вы заслуживаете выглядеть на 100%.${top1 ? `\n\n"${top1}" — самая популярная услуга у наших клиентов.` : ''}\n\nЗапишитесь и получите бонус при первом визите 🎁`
        : `✨ ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} — самое время для ухода.${top1 ? ` "${top1}"` : ''} — ждём вас!`,
      insight: isSummer
        ? 'Лето — сезон активности. Клиенты обновляют внешность перед отпуском и важными событиями.'
        : 'Сезонный спрос на процедуры красоты вырастает на 20–30% в переходные периоды.',
      careTitle: 'Уход между визитами',
      careTips: `✨ Несколько советов чтобы дольше сохранить результат процедуры:\n1) Следуйте рекомендациям мастера\n2) Используйте профессиональную косметику\n3) Приходите своевременно на коррекцию\n\nВопросы — пишите нам!`,
    },
    skin: {
      title: isSummer ? 'Кожа летом: защита и сияние' : `Уход за кожей в ${monthNameR}`,
      text: isSummer
        ? `🌞 Летнее солнце — стресс для кожи. Наши процедуры восстанавливают, увлажняют и защищают.${top1 ? `\n\n"${top1}" — топ-услуга этого сезона.` : ''}\n\nЗапишитесь на летний уход сейчас 🎁`
        : `✨ ${top1 || 'Уход за лицом'} — инвестиция в вашу кожу. Результат виден уже после первой процедуры.`,
      insight: isSummer
        ? 'Летом кожа требует особого внимания: SPF, увлажнение, постпляжное восстановление.'
        : 'Регулярный уход за кожей раз в месяц — основа молодости и свежего вида.',
      careTitle: isSummer ? 'Как ухаживать за кожей летом' : 'Уход за кожей дома',
      careTips: `🌞 3 правила летней кожи:\n1) SPF 50 каждое утро, даже в облачный день\n2) Мицеллярная вода вечером — смыть солнцезащиту\n3) Увлажняющая маска 2 раза в неделю\n\nСохраняй 💛`,
    },
    hair: {
      title: isSummer ? 'Лето — время для смелых образов' : `Обновление в ${monthNameR}`,
      text: isSummer
        ? `☀️ Лето 2026 — это яркие блонды, балаяж и стойкие покрытия.${top1 ? `\n\n"${top1}" бьёт рекорды популярности.` : ''}\n\nЗапишитесь на летнее обновление образа. Первые 5 заявок — бонус укладка в подарок 🎁`
        : `🌸 ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} — лучшее время для обновления!${top1 ? ` "${top1}"` : ' Стрижка и укладка'} — приходите к нам.`,
      insight: isSummer
        ? 'Июнь–август: пик запросов на осветление +40%. Клиенты готовы тратить больше на летний образ.'
        : `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}: спрос на обновление образа вырастает на 25–30%.`,
      careTitle: isSummer ? 'Уход за волосами летом' : 'Уход между визитами',
      careTips: isSummer
        ? `🌊 3 правила для волос этим летом:\n1) Защитный спрей с UV-фильтром перед пляжем\n2) Восстанавливающая маска после моря\n3) Прохладная вода при мытье — сохраняет цвет\n\nСохраняй 💛`
        : `✨ Как сохранить результат окрашивания дольше:\n1) Шампунь без сульфатов\n2) Маска раз в неделю\n3) Термозащита перед укладкой\n\nВопросы — пишите в директ!`,
    },
  }

  const s = seasonal[data.salonType] || seasonal.general

  // Loyalty text adapted to service type
  const loyaltyService: Record<string, string> = {
    nail: 'маникюр или педикюр',
    brow: 'коррекцию бровей',
    lash: 'коррекцию ресниц',
    skin: 'уходовую процедуру',
    hair: 'укладку или маску',
    general: 'любую процедуру',
  }
  const loyaltyBonus = loyaltyService[data.salonType] || 'процедуру'

  // Retention text with actual top service name
  const retentionServiceHint = top1 ? ` — и "{{top1}}" уже ждёт вас`.replace('{{top1}}', top1) : ''

  const posts = [
    {
      id: 'retention',
      type: 'Возврат клиентов',
      typeColor: 'text-rose-600',
      cardColor: 'bg-rose-50 border-rose-200',
      platform: 'WhatsApp / SMS',
      platformIcon: '💬',
      title: 'Мы скучаем',
      text: `Привет! Вы не были у нас уже больше месяца 🙂${retentionServiceHint}\n\nСпециально для вас — скидка 500 ₽ на следующий визит. Запишитесь прямо сейчас — просто ответьте на это сообщение.`,
      insight: `${data.atRisk} клиентов не приходили 30–90 дней — это ${returnPct}% базы. Рассылка с 10% конверсией вернёт ${Math.round(data.atRisk * 0.1)} человек.`,
      potential: data.atRisk > 0 ? `+${Math.round(data.atRisk * 0.1 * data.avgCheck).toLocaleString('ru-RU')} ₽` : null,
      priority: 'high',
      scheduledDay: 2,
    },
    {
      id: 'summer',
      type: isSummer ? 'Сезон' : 'Актуально',
      typeColor: 'text-amber-600',
      cardColor: 'bg-amber-50 border-amber-200',
      platform: 'Instagram',
      platformIcon: '📸',
      title: s.title,
      text: s.text,
      insight: s.insight,
      potential: null,
      priority: 'medium',
      scheduledDay: 5,
    },
    {
      id: 'loyalty',
      type: 'Лояльность',
      typeColor: 'text-emerald-700',
      cardColor: 'bg-emerald-50 border-emerald-200',
      platform: 'Telegram',
      platformIcon: '✈️',
      title: 'Бонус за верность',
      text: `💚 Наши постоянные клиенты — наша гордость. Каждый 5-й визит — ${loyaltyBonus} в подарок. Уточняйте у мастера при записи!`,
      insight: `${data.active} активных клиентов — ваша самая ценная аудитория. Программа лояльности увеличивает частоту визитов на 20–35%.`,
      potential: null,
      priority: 'medium',
      scheduledDay: 10,
    },
    {
      id: 'content',
      type: 'Полезный контент',
      typeColor: 'text-violet-600',
      cardColor: 'bg-violet-50 border-violet-200',
      platform: 'Instagram / ВКонтакте',
      platformIcon: '💡',
      title: s.careTitle,
      text: s.careTips,
      insight: 'Образовательный контент даёт +60% к охвату по сравнению с рекламными постами. Сохранения = будущие клиенты.',
      potential: null,
      priority: 'low',
      scheduledDay: 15,
    },
  ]

  // If we have a clear top service with significant count, add a 5th "top service" post
  if (top1 && topCount >= 5) {
    posts.push({
      id: 'top-service',
      type: 'Хит услуг',
      typeColor: 'text-indigo-600',
      cardColor: 'bg-indigo-50 border-indigo-200',
      platform: 'Instagram / ВКонтакте',
      platformIcon: '🏆',
      title: `"${top1}" — выбор ваших клиентов`,
      text: `${topCount} клиентов выбрали "${top1}" — и это не случайно 💜${top2 ? `\n\nТакже в топе: "${top2}"${top3 ? ` и "${top3}"` : ''}.` : ''}\n\nЗапишитесь к нам и убедитесь сами. Онлайн-запись — в шапке профиля ⬆️`,
      insight: `"${top1}" — самая популярная услуга по данным записей. Упоминайте её в постах — клиенты ищут то, что уже нравится другим.`,
      potential: null,
      priority: 'medium' as const,
      scheduledDay: 7,
    })
  }

  return posts
}

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  const [clientsRes, visitsRes] = await Promise.all([
    supabaseAdmin.from('clients').select('status, avg_check, total_revenue').eq('salon_id', salonId),
    supabaseAdmin.from('visits').select('service_name, amount').eq('salon_id', salonId).limit(1000),
  ])

  const clients = clientsRes.data || []
  const visits = visitsRes.data || []

  const atRisk = clients.filter(c => c.status === 'at_risk')
  const active = clients.filter(c => c.status === 'active')
  const lost = clients.filter(c => c.status === 'lost')
  const avgCheck = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + (c.avg_check || 0), 0) / clients.length)
    : 800
  const atRiskRevenue = atRisk.reduce((s, c) => s + (c.avg_check || 0), 0)

  // Build top services from visit data
  const serviceCount = new Map<string, number>()
  for (const v of visits) {
    if (v.service_name) {
      const key = v.service_name.trim()
      serviceCount.set(key, (serviceCount.get(key) || 0) + 1)
    }
  }
  const topServices: ServiceStat[] = [...serviceCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const salonType = detectSalonType(topServices)

  const data = {
    atRisk: atRisk.length,
    lost: lost.length,
    total: clients.length,
    active: active.length,
    avgCheck,
    topServices,
    atRiskRevenue,
    salonType,
  }

  const posts = generatePosts(data)

  const m = currentMonth()
  const isSummer = m >= 5 && m <= 7

  return NextResponse.json({
    data: { ...data, topService: topServices[0]?.name || null },
    posts,
    brief: {
      month: MONTH_NAMES[m].charAt(0).toUpperCase() + MONTH_NAMES[m].slice(1),
      isSummer,
      hasSalonData: clients.length > 0,
      salonType,
      topServices,
    },
  })
}
