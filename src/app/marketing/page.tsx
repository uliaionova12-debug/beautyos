'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Sparkles, Send, Copy, CheckCircle2,
  ChevronRight, RefreshCw, Download, ImageIcon,
} from 'lucide-react'
import { VoiceButton } from '@/components/ui/VoiceButton'

// ─── Goal / Platform / Format definitions ─────────────────────────────────────

const GOALS = [
  { id: 'fill_slots',       label: 'Заполнить свободные окна',      emoji: '📅', desc: 'Привлечь клиентов на пустые слоты' },
  { id: 'reactivate',       label: 'Вернуть клиентов',              emoji: '💌', desc: 'Тех, кто давно не приходил' },
  { id: 'raise_check',      label: 'Поднять средний чек',           emoji: '📈', desc: 'Через дополнительные услуги' },
  { id: 'collect_reviews',  label: 'Собрать отзывы',                emoji: '⭐', desc: 'Органично, без давления' },
  { id: 'show_expertise',   label: 'Показать экспертность',         emoji: '🎯', desc: 'Профессиональные наблюдения' },
  { id: 'salon_life',       label: 'Рассказать о жизни салона',     emoji: '🏠', desc: 'Закулисье, будни, атмосфера' },
  { id: 'promote_master',   label: 'Продвинуть мастера',            emoji: '✨', desc: 'История, путь, экспертность' },
  { id: 'promote_service',  label: 'Продвинуть услугу',             emoji: '💅', desc: 'Когда нужна, кому подходит' },
  { id: 'seasonal',         label: 'Сезонная кампания',             emoji: '🌿', desc: 'Серия контента вокруг сезона' },
] as const

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram',  emoji: '📸' },
  { id: 'vk',        label: 'ВКонтакте', emoji: '💙' },
  { id: 'telegram',  label: 'Telegram',  emoji: '✈️' },
  { id: 'whatsapp',  label: 'WhatsApp',  emoji: '💬' },
  { id: 'email',     label: 'Email',     emoji: '📧' },
] as const

const FORMATS = [
  { id: 'post',           label: 'Пост',          desc: '100–200 слов, готов к публикации' },
  { id: 'stories',        label: 'Stories',       desc: '3–5 экранов по 1–2 предложения' },
  { id: 'reels',          label: 'Reels',         desc: 'Что показать + что сказать' },
  { id: 'video_script',   label: 'Сценарий видео', desc: 'Тезисы для говорящей головы' },
  { id: 'photo_series',   label: 'Серия фото',    desc: 'Подписи к 5–7 снимкам' },
  { id: 'content_plan',   label: 'Контент-план',  desc: 'Темы и углы подачи' },
  { id: 'weekly_plan',    label: 'На неделю',     desc: '5–7 постов по дням' },
  { id: 'monthly_plan',   label: 'На месяц',      desc: '20+ постов по неделям' },
] as const

type FormatId   = typeof FORMATS[number]['id']
type Step       = 'goal' | 'platform' | 'format' | 'result' | 'visual' | 'compose'
type VisualChoice = 'photos' | 'generate' | null
type ImageSizeId  = 'ig_post' | 'ig_story' | 'telegram' | 'vk'

interface Message { role: 'user' | 'assistant'; content: string }

const SUPPORTS_VISUAL = new Set<FormatId>(['post', 'photo_series', 'stories'])

const IMAGE_SIZES: { id: ImageSizeId; label: string; aspect: string; w: number; h: number }[] = [
  { id: 'ig_post',  label: 'Instagram',  aspect: '1/1',  w: 1080, h: 1080 },
  { id: 'ig_story', label: 'Stories',    aspect: '9/16', w: 1080, h: 1920 },
  { id: 'telegram', label: 'Telegram',   aspect: '16/9', w: 1280, h: 720  },
  { id: 'vk',       label: 'ВКонтакте', aspect: '16/9', w: 1200, h: 628  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function compressImage(dataUrl: string, maxDim = 900): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.78))
    }
    img.src = dataUrl
  })
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function renderContent(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        return <p key={i} className="font-bold text-graphite mt-3 mb-1 text-sm">{line.replace(/^#{2,3} /, '')}</p>
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-graphite mt-2">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 ml-2 my-0.5">
            <span className="text-terracotta shrink-0 mt-0.5">·</span>
            <span className="text-sm text-graphite/90 leading-relaxed">{line.replace(/^[•\-] /, '')}</span>
          </div>
        )
      }
      if (/^\d+\. /.test(line)) {
        return (
          <div key={i} className="flex gap-2 ml-2 my-0.5">
            <span className="text-terracotta font-semibold text-sm shrink-0">{line.match(/^\d+/)?.[0]}.</span>
            <span className="text-sm text-graphite/90 leading-relaxed">{line.replace(/^\d+\. /, '')}</span>
          </div>
        )
      }
      if (line.startsWith('«') || (line.startsWith('"') && line.length > 10)) {
        return (
          <div key={i} className="bg-terracotta/8 border-l-2 border-terracotta/40 rounded-r-lg px-3 py-2 my-2">
            <p className="text-sm text-graphite italic leading-relaxed">{line}</p>
          </div>
        )
      }
      if (line.trim() === '') return <div key={i} className="h-1.5" />
      return <p key={i} className="text-sm text-graphite/90 leading-relaxed">{line}</p>
    })
  }

  return (
    <div className="mb-4">
      <div className="bg-card border border-parchment rounded-2xl px-4 py-4">
        <div className="space-y-0.5">{renderContent(msg.content)}</div>
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-dusk/50 hover:text-dusk transition-colors"
        >
          {copied ? <><CheckCircle2 size={12} className="text-emerald-500" />Скопировано</> : <><Copy size={12} />Копировать</>}
        </button>
        {msg.role === 'assistant' && (
          <div className="flex items-center gap-1">
            <Sparkles size={10} className="text-terracotta/40" />
            <span className="text-[10px] text-dusk/30">Директор по маркетингу</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({
  goal, platform, format, onGoTo,
}: {
  goal: typeof GOALS[number] | null
  platform: typeof PLATFORMS[number] | null
  format: typeof FORMATS[number] | null
  onGoTo: (step: Step) => void
}) {
  if (!goal) return null
  return (
    <div className="flex items-center gap-1 flex-wrap mb-6">
      <button
        onClick={() => onGoTo('goal')}
        className="flex items-center gap-1 text-xs bg-terracotta/10 text-terracotta px-2.5 py-1.5 rounded-full hover:bg-terracotta/20 transition-colors"
      >
        <span>{goal.emoji}</span>
        <span className="font-medium">{goal.label}</span>
      </button>
      {platform && (
        <>
          <ChevronRight size={12} className="text-dusk/30" />
          <button
            onClick={() => onGoTo('platform')}
            className="flex items-center gap-1 text-xs bg-parchment text-graphite/70 px-2.5 py-1.5 rounded-full hover:bg-terracotta/10 hover:text-terracotta transition-colors"
          >
            <span>{platform.emoji}</span>
            <span>{platform.label}</span>
          </button>
        </>
      )}
      {format && (
        <>
          <ChevronRight size={12} className="text-dusk/30" />
          <button
            onClick={() => onGoTo('format')}
            className="text-xs bg-parchment text-graphite/70 px-2.5 py-1.5 rounded-full hover:bg-terracotta/10 hover:text-terracotta transition-colors"
          >
            {format.label}
          </button>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''

  const [step, setStep]                 = useState<Step>('goal')
  const [selectedGoal, setGoal]         = useState<typeof GOALS[number] | null>(null)
  const [selectedPlatform, setPlatform] = useState<typeof PLATFORMS[number] | null>(null)
  const [selectedFormat, setFormat]     = useState<typeof FORMATS[number] | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Visual / Compose state
  const [visualChoice, setVisualChoice]         = useState<VisualChoice>(null)
  const [uploadedPhotos, setUploadedPhotos]     = useState<Array<{ name: string; dataUrl: string }>>([])
  const [photoAnalysis, setPhotoAnalysis]       = useState('')
  const [selectedImage, setSelectedImage]       = useState<string | null>(null)
  const [generatedPrompt, setGeneratedPrompt]   = useState('')
  const [headlines, setHeadlines]               = useState<string[]>([])
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null)
  const [imageSize, setImageSize]               = useState<ImageSizeId>('ig_post')
  const [isAnalyzing, setIsAnalyzing]           = useState(false)
  const [isGenerating, setIsGenerating]         = useState(false)
  const [generationError, setGenerationError]   = useState<string | null>(null)
  const [isLoadingHeadlines, setIsLoadingHeadlines] = useState(false)
  const [isDownloading, setIsDownloading]       = useState(false)
  const [customHeadline, setCustomHeadline]     = useState('')

  const bottomRef    = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function resetVisual() {
    setVisualChoice(null)
    setUploadedPhotos([])
    setPhotoAnalysis('')
    setSelectedImage(null)
    setGeneratedPrompt('')
    setGenerationError(null)
    setHeadlines([])
    setSelectedHeadline(null)
    setCustomHeadline('')
    setIsAnalyzing(false)
    setIsGenerating(false)
    setIsLoadingHeadlines(false)
  }

  function goTo(s: Step) {
    if (s === 'goal')     { setGoal(null); setPlatform(null); setFormat(null); setMessages([]); resetVisual() }
    if (s === 'platform') { setPlatform(null); setFormat(null); setMessages([]); resetVisual() }
    if (s === 'format')   { setFormat(null); setMessages([]); resetVisual() }
    if (s === 'result')   { resetVisual() }
    setStep(s)
  }

  function selectGoal(g: typeof GOALS[number]) {
    setGoal(g); setPlatform(null); setFormat(null); setMessages([])
    setStep('platform')
  }

  function selectPlatform(p: typeof PLATFORMS[number]) {
    setPlatform(p); setFormat(null); setMessages([])
    setStep('format')
  }

  async function selectFormat(f: typeof FORMATS[number]) {
    setFormat(f)
    setMessages([])
    setStep('result')
    await generate(f)
  }

  async function generate(f: typeof FORMATS[number]) {
    if (!selectedGoal || !selectedPlatform || !salonId) return
    setLoading(true)
    try {
      const res = await fetch('/api/marketing-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          salon_id: salonId,
          goal:     selectedGoal.id,
          platform: selectedPlatform.id,
          format:   f.id,
        }),
      })
      const data = await res.json()
      setMessages([{ role: 'assistant', content: data.message }])
    } catch {
      setMessages([{ role: 'assistant', content: 'Ошибка. Попробуйте ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  async function sendFollowUp(text: string) {
    if (!text.trim() || loading || !selectedGoal || !selectedPlatform || !selectedFormat) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/marketing-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          salon_id: salonId,
          goal:     selectedGoal.id,
          platform: selectedPlatform.id,
          format:   selectedFormat.id,
        }),
      })
      const data = await res.json()
      setMessages([...updated, { role: 'assistant', content: data.message }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Ошибка. Попробуйте ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  // ─── Visual handlers ─────────────────────────────────────────────────────────

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5)
    if (files.length === 0) return
    const photos = await Promise.all(
      files.map(async file => {
        const raw = await new Promise<string>(resolve => {
          const reader = new FileReader()
          reader.onload = ev => resolve(ev.target?.result as string)
          reader.readAsDataURL(file)
        })
        return { name: file.name, dataUrl: await compressImage(raw) }
      })
    )
    setUploadedPhotos(photos)
    setPhotoAnalysis('')
  }

  async function handleAnalyzePhotos() {
    if (uploadedPhotos.length === 0) return
    const lastAi = messages.filter(m => m.role === 'assistant').slice(-1)[0]
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/marketing-agent/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: uploadedPhotos.map(p => p.dataUrl),
          postText: lastAi?.content?.slice(0, 400) || '',
          goal: selectedGoal?.id || '',
        }),
      })
      const data = await res.json()
      setPhotoAnalysis(data.analysis || 'Не удалось проанализировать.')
    } catch {
      setPhotoAnalysis('Ошибка анализа. Попробуйте ещё раз.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleGenerateImage() {
    const lastAi = messages.filter(m => m.role === 'assistant').slice(-1)[0]
    setVisualChoice('generate')
    setSelectedImage(null)
    setGenerationError(null)
    setIsGenerating(true)
    try {
      const res = await fetch('/api/marketing-agent/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: selectedGoal?.id || '',
          platform: selectedPlatform?.id || '',
          postText: lastAi?.content?.slice(0, 400) || '',
        }),
      })
      const data = await res.json()
      if (data.imageDataUrl) {
        setSelectedImage(data.imageDataUrl)
        setGeneratedPrompt(data.prompt || '')
      } else {
        setGenerationError('Изображение не создалось. Попробуйте ещё раз — обычно со второй попытки получается.')
      }
    } catch {
      setGenerationError('Не удалось связаться с сервером генерации. Проверьте подключение и попробуйте снова.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function goToCompose(imageDataUrl: string) {
    setSelectedImage(imageDataUrl)
    setSelectedHeadline(null)
    setCustomHeadline('')
    setHeadlines([])
    setStep('compose')

    const lastAi = messages.filter(m => m.role === 'assistant').slice(-1)[0]
    if (!lastAi) return
    setIsLoadingHeadlines(true)
    try {
      const res = await fetch('/api/marketing-agent/headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postText: lastAi.content,
          goal: selectedGoal?.id || '',
        }),
      })
      const data = await res.json()
      const hs: string[] = data.headlines || []
      setHeadlines(hs)
      if (hs[0]) setSelectedHeadline(hs[0])
    } catch {
      setHeadlines([])
    } finally {
      setIsLoadingHeadlines(false)
    }
  }

  async function handleDownload() {
    const headline = customHeadline.trim() || selectedHeadline
    if (!selectedImage || !headline || isDownloading) return
    setIsDownloading(true)
    try {
      const size = IMAGE_SIZES.find(s => s.id === imageSize)!
      const { w, h } = size
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      await document.fonts.ready

      await new Promise<void>(resolve => {
        const img = new Image()
        img.onload = () => {
          const scale = Math.max(w / img.width, h / img.height)
          const iw = img.width * scale
          const ih = img.height * scale
          ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih)

          const grad = ctx.createLinearGradient(0, h * 0.4, 0, h)
          grad.addColorStop(0, 'rgba(0,0,0,0)')
          grad.addColorStop(1, 'rgba(0,0,0,0.7)')
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, w, h)

          const fontSize = Math.round(w * 0.053)
          ctx.font = `700 ${fontSize}px Manrope, -apple-system, system-ui, sans-serif`
          ctx.fillStyle = '#FFFFFF'
          ctx.shadowBlur = 14
          ctx.shadowColor = 'rgba(0,0,0,0.35)'

          const pad = Math.round(w * 0.046)
          const maxW = w - pad * 2
          const lineH = fontSize * 1.3
          const words = headline.split(' ')
          const lines: string[] = []
          let line = ''
          for (const word of words) {
            const test = line + word + ' '
            if (ctx.measureText(test).width > maxW && line) { lines.push(line.trim()); line = word + ' ' }
            else line = test
          }
          if (line.trim()) lines.push(line.trim())

          const startY = h - lines.length * lineH - pad
          lines.forEach((l, i) => ctx.fillText(l, pad, startY + i * lineH))

          canvas.toBlob(blob => {
            if (!blob) { resolve(); return }
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `beautyos-${imageSize}.png`
            a.click()
            URL.revokeObjectURL(url)
            resolve()
          }, 'image/png')
        }
        img.src = selectedImage!
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const activeHeadline = customHeadline.trim() || selectedHeadline

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/actions?salon_id=${salonId}`}
            className="flex items-center gap-1.5 text-sm text-dusk hover:text-graphite transition-colors"
          >
            <ArrowLeft size={14} />
            Действия
          </Link>
          <div className="text-center">
            <p className="text-sm font-semibold text-graphite">
              {step === 'compose' ? 'AI Content Studio' : 'Директор по маркетингу'}
            </p>
            <p className="text-[10px] text-dusk">
              {step === 'compose' ? 'Визуал · Заголовок · Публикация' : 'Бизнес-задача → контент'}
            </p>
          </div>
          <div className="w-20" />
        </div>

        {/* ── STEP 1: Goal ──────────────────────────────────────────────────── */}
        {step === 'goal' && (
          <div>
            <h2 className="text-xl font-bold text-graphite mb-1">Какую задачу решаем сегодня?</h2>
            <p className="text-sm text-dusk mb-6">Выберите бизнес-цель — контент подстраивается под неё</p>
            <div className="grid grid-cols-1 gap-2">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => selectGoal(g)}
                  className="flex items-center gap-4 bg-card border border-parchment hover:border-terracotta/40 hover:bg-terracotta/4 rounded-2xl px-5 py-4 text-left transition-all group"
                >
                  <span className="text-2xl shrink-0">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-graphite">{g.label}</p>
                    <p className="text-xs text-dusk mt-0.5">{g.desc}</p>
                  </div>
                  <ChevronRight size={15} className="text-dusk/30 group-hover:text-terracotta/60 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Platform ──────────────────────────────────────────────── */}
        {step === 'platform' && selectedGoal && (
          <div>
            <Breadcrumb goal={selectedGoal} platform={null} format={null} onGoTo={goTo} />
            <h2 className="text-xl font-bold text-graphite mb-1">Где публикуем?</h2>
            <p className="text-sm text-dusk mb-6">Тон и формат адаптируются под площадку</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectPlatform(p)}
                  className="flex flex-col items-center gap-2 bg-card border border-parchment hover:border-terracotta/40 hover:bg-terracotta/4 rounded-2xl py-6 px-4 text-center transition-all"
                >
                  <span className="text-3xl">{p.emoji}</span>
                  <p className="text-sm font-semibold text-graphite">{p.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Format ────────────────────────────────────────────────── */}
        {step === 'format' && selectedGoal && selectedPlatform && (
          <div>
            <Breadcrumb goal={selectedGoal} platform={selectedPlatform} format={null} onGoTo={goTo} />
            <h2 className="text-xl font-bold text-graphite mb-1">Какой формат нужен?</h2>
            <p className="text-sm text-dusk mb-6">Директор сформирует контент под выбранный формат</p>
            <div className="grid grid-cols-1 gap-2">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => selectFormat(f)}
                  className="flex items-center justify-between bg-card border border-parchment hover:border-terracotta/40 hover:bg-terracotta/4 rounded-2xl px-5 py-4 text-left transition-all group"
                >
                  <div>
                    <p className="text-sm font-semibold text-graphite">{f.label}</p>
                    <p className="text-xs text-dusk mt-0.5">{f.desc}</p>
                  </div>
                  <ChevronRight size={15} className="text-dusk/30 group-hover:text-terracotta/60 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Result ────────────────────────────────────────────────── */}
        {step === 'result' && selectedGoal && selectedPlatform && selectedFormat && (
          <div>
            <Breadcrumb goal={selectedGoal} platform={selectedPlatform} format={selectedFormat} onGoTo={goTo} />

            {loading && messages.length === 0 && (
              <div className="bg-card border border-parchment rounded-2xl p-8 text-center">
                <div className="flex gap-1.5 justify-center mb-3">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 bg-terracotta/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <p className="text-sm text-graphite font-medium mb-1">Директор работает над задачей</p>
                <p className="text-xs text-dusk">
                  {selectedGoal.label} · {selectedPlatform.label} · {selectedFormat.label}
                </p>
              </div>
            )}

            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

            {loading && messages.length > 0 && (
              <div className="bg-card border border-parchment rounded-2xl px-4 py-3 mb-4">
                <div className="flex gap-1 items-center">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-terracotta/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />

            {messages.length > 0 && !loading && (
              <div className="mt-2 space-y-3">
                <button
                  onClick={() => generate(selectedFormat)}
                  className="flex items-center gap-2 text-xs text-dusk hover:text-graphite transition-colors"
                >
                  <RefreshCw size={12} />
                  Другой вариант
                </button>

                <div className="bg-card border border-parchment rounded-2xl shadow-sm">
                  <div className="flex items-end gap-2 p-3">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFollowUp(input) } }}
                      placeholder="Сделай короче / измени тон / добавь призыв к действию..."
                      disabled={loading}
                      rows={1}
                      className="flex-1 bg-transparent text-sm text-graphite placeholder:text-dusk/40 resize-none outline-none leading-relaxed disabled:opacity-40"
                      style={{ maxHeight: '100px' }}
                      onInput={e => {
                        const t = e.target as HTMLTextAreaElement
                        t.style.height = 'auto'
                        t.style.height = Math.min(t.scrollHeight, 100) + 'px'
                      }}
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <VoiceButton
                        onTranscript={t => setInput(prev => prev ? prev + ' ' + t : t)}
                        disabled={loading}
                        size="sm"
                      />
                      <button
                        onClick={() => sendFollowUp(input)}
                        disabled={!input.trim() || loading}
                        className="p-2 bg-terracotta rounded-xl text-white disabled:opacity-30 hover:bg-terracotta/90 transition-colors"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Сделай короче',
                    'Измени финал',
                    'Добавь конкретики',
                    'Другой тон — более личный',
                    'Ещё один вариант',
                    'Убери призыв к действию',
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => sendFollowUp(q)}
                      disabled={loading}
                      className="text-xs bg-parchment text-graphite/70 hover:bg-terracotta/10 hover:text-terracotta rounded-xl px-3 py-2 transition-all disabled:opacity-40"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Visual CTA — only for post/stories/photo_series */}
                {SUPPORTS_VISUAL.has(selectedFormat.id) && (
                  <div className="border-t border-parchment pt-5">
                    <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-3">Следующий шаг</p>
                    <button
                      onClick={() => setStep('visual')}
                      className="w-full flex items-center gap-4 bg-graphite text-white rounded-2xl px-5 py-4 hover:opacity-90 transition-opacity"
                    >
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <ImageIcon size={18} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-semibold">Создать визуал для публикации</p>
                        <p className="text-xs text-white/55 mt-0.5">Изображение + заголовок · Soft Luxury стиль</p>
                      </div>
                      <ChevronRight size={16} className="text-white/40" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 5: Visual ────────────────────────────────────────────────── */}
        {step === 'visual' && selectedGoal && selectedPlatform && selectedFormat && (
          <div>
            <Breadcrumb goal={selectedGoal} platform={selectedPlatform} format={selectedFormat} onGoTo={goTo} />

            <button
              onClick={() => goTo('result')}
              className="flex items-center gap-1.5 text-sm text-dusk hover:text-graphite transition-colors mb-6"
            >
              <ArrowLeft size={14} />
              Назад к тексту
            </button>

            <h2 className="text-xl font-bold text-graphite mb-1">Визуал для публикации</h2>
            <p className="text-sm text-dusk mb-6">Выберите источник изображения</p>

            {/* Option cards — shown when nothing selected yet */}
            {!visualChoice && (
              <div className="space-y-3">
                <button
                  onClick={() => { setVisualChoice('photos'); setTimeout(() => photoInputRef.current?.click(), 50) }}
                  className="w-full flex items-center gap-4 bg-card border border-parchment hover:border-terracotta/40 rounded-2xl p-5 text-left transition-all group"
                >
                  <div className="w-12 h-12 bg-terracotta/8 rounded-xl flex items-center justify-center text-2xl shrink-0">📷</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-graphite">Использовать мои фотографии</p>
                    <p className="text-xs text-dusk mt-1">До 5 фото — AI выберет лучшее для поста</p>
                  </div>
                  <ChevronRight size={15} className="text-dusk/30 shrink-0" />
                </button>

                <button
                  onClick={handleGenerateImage}
                  className="w-full flex items-center gap-4 bg-card border border-parchment hover:border-terracotta/40 rounded-2xl p-5 text-left transition-all group"
                >
                  <div className="w-12 h-12 bg-terracotta/8 rounded-xl flex items-center justify-center text-2xl shrink-0">✨</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-graphite">Сгенерировать изображение</p>
                    <p className="text-xs text-dusk mt-1">AI создаст Soft Luxury фото по содержанию поста</p>
                  </div>
                  <ChevronRight size={15} className="text-dusk/30 shrink-0" />
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Photos flow */}
            {visualChoice === 'photos' && (
              <div className="space-y-4">
                {uploadedPhotos.length === 0 ? (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-parchment rounded-2xl py-10 text-center hover:border-terracotta/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-graphite mb-1">Выбрать фотографии</p>
                    <p className="text-xs text-dusk">До 5 фото · JPG, PNG, HEIC</p>
                  </button>
                ) : (
                  <>
                    {/* Thumbnails */}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {uploadedPhotos.map((photo, i) => (
                        <button
                          key={i}
                          onClick={() => goToCompose(photo.dataUrl)}
                          className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-terracotta/50 transition-colors group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.dataUrl} alt={photo.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold drop-shadow transition-opacity">Выбрать</span>
                          </div>
                          <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {i + 1}
                          </span>
                        </button>
                      ))}
                      {uploadedPhotos.length < 5 && (
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-parchment flex items-center justify-center text-dusk/40 hover:border-terracotta/30 hover:text-terracotta/50 transition-colors text-2xl"
                        >
                          +
                        </button>
                      )}
                    </div>

                    {/* Analyze button */}
                    {!photoAnalysis && (
                      <button
                        onClick={handleAnalyzePhotos}
                        disabled={isAnalyzing}
                        className="w-full flex items-center justify-center gap-2 bg-terracotta/10 text-terracotta rounded-2xl py-3 text-sm font-semibold hover:bg-terracotta/15 disabled:opacity-50 transition-colors"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="flex gap-1">
                              {[0, 100, 200].map(d => <span key={d} className="w-1.5 h-1.5 bg-terracotta/60 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                            </div>
                            Анализирую...
                          </>
                        ) : (
                          <><Sparkles size={15} />Проанализировать фото</>
                        )}
                      </button>
                    )}

                    {/* Analysis result */}
                    {photoAnalysis && (
                      <div className="bg-card border border-parchment rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles size={13} className="text-terracotta/60" />
                          <span className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest">Рекомендация AI</span>
                        </div>
                        <p className="text-sm text-graphite/90 leading-relaxed whitespace-pre-line">{photoAnalysis}</p>
                        <p className="text-xs text-dusk/50">Нажмите на фото выше, чтобы выбрать его для публикации</p>
                      </div>
                    )}

                    <button
                      onClick={() => { setUploadedPhotos([]); setPhotoAnalysis(''); photoInputRef.current?.click() }}
                      className="flex items-center gap-1.5 text-xs text-dusk hover:text-graphite transition-colors"
                    >
                      <RefreshCw size={12} />
                      Заменить фотографии
                    </button>
                  </>
                )}

                <button
                  onClick={() => setVisualChoice(null)}
                  className="flex items-center gap-1.5 text-xs text-dusk/60 hover:text-dusk transition-colors"
                >
                  <ArrowLeft size={12} />
                  Другой вариант
                </button>
              </div>
            )}

            {/* Generate flow */}
            {visualChoice === 'generate' && (
              <div className="space-y-4">
                {isGenerating && (
                  <div className="bg-card border border-parchment rounded-2xl p-8 text-center">
                    <div className="flex gap-1.5 justify-center mb-4">
                      {[0, 150, 300].map(d => (
                        <div key={d} className="w-2 h-2 bg-terracotta/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-graphite">Создаю изображение...</p>
                    <p className="text-xs text-dusk mt-1">Soft Luxury Beauty · около 15–20 секунд</p>
                  </div>
                )}

                {generationError && !isGenerating && !selectedImage && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-3">
                    <p className="text-sm font-medium text-red-700">{generationError}</p>
                    <button
                      onClick={handleGenerateImage}
                      className="flex items-center gap-1.5 mx-auto text-xs text-red-600 hover:text-red-800 border border-red-300 rounded-xl px-4 py-2 transition-colors"
                    >
                      <RefreshCw size={12} />
                      Попробовать снова
                    </button>
                  </div>
                )}

                {selectedImage && !isGenerating && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedImage}
                      alt="Generated"
                      className="w-full rounded-2xl aspect-square object-cover"
                    />

                    {generatedPrompt && (
                      <details className="text-xs text-dusk/50">
                        <summary className="cursor-pointer hover:text-dusk transition-colors">Промт генерации</summary>
                        <p className="mt-2 bg-parchment/60 rounded-xl p-3 leading-relaxed">{generatedPrompt}</p>
                      </details>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateImage}
                        className="flex items-center gap-1.5 text-xs text-dusk hover:text-graphite border border-parchment rounded-xl px-3 py-2.5 transition-colors"
                      >
                        <RefreshCw size={12} />
                        Другой вариант
                      </button>
                      <button
                        onClick={() => goToCompose(selectedImage)}
                        className="flex-1 flex items-center justify-center gap-2 bg-graphite text-white rounded-xl px-4 py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Добавить заголовок
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </>
                )}

                <button
                  onClick={() => { setVisualChoice(null); setSelectedImage(null) }}
                  className="flex items-center gap-1.5 text-xs text-dusk/60 hover:text-dusk transition-colors"
                >
                  <ArrowLeft size={12} />
                  Другой вариант
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 6: Compose ───────────────────────────────────────────────── */}
        {step === 'compose' && selectedImage && (
          <div>
            <button
              onClick={() => setStep('visual')}
              className="flex items-center gap-1.5 text-sm text-dusk hover:text-graphite transition-colors mb-6"
            >
              <ArrowLeft size={14} />
              Назад
            </button>

            <h2 className="text-xl font-bold text-graphite mb-6">Готово к публикации</h2>

            {/* Size selector */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {IMAGE_SIZES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setImageSize(s.id)}
                  className={`shrink-0 text-xs px-3 py-2 rounded-xl border transition-colors ${
                    imageSize === s.id
                      ? 'bg-graphite text-white border-graphite'
                      : 'bg-card border-parchment text-dusk hover:border-graphite/30 hover:text-graphite'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Preview */}
            {(() => {
              const sz = IMAGE_SIZES.find(s => s.id === imageSize)!
              return (
                <div
                  className="relative overflow-hidden rounded-2xl bg-graphite/5 mb-6 w-full"
                  style={{ aspectRatio: sz.aspect, maxHeight: '70vw' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  {activeHeadline && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                      <p className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow-lg">
                        {activeHeadline}
                      </p>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Headline selection */}
            <div className="space-y-2 mb-5">
              <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-3">Заголовок на изображении</p>

              {isLoadingHeadlines ? (
                <div className="flex items-center gap-2 py-3 text-sm text-dusk">
                  <div className="flex gap-1">
                    {[0, 100, 200].map(d => <span key={d} className="w-1.5 h-1.5 bg-terracotta/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                  Подбираю заголовки...
                </div>
              ) : (
                headlines.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedHeadline(h); setCustomHeadline('') }}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      selectedHeadline === h && !customHeadline.trim()
                        ? 'border-graphite bg-graphite/5 font-semibold text-graphite'
                        : 'border-parchment bg-card text-graphite/70 hover:border-graphite/30'
                    }`}
                  >
                    {h}
                  </button>
                ))
              )}

              <div className="relative">
                <input
                  type="text"
                  value={customHeadline}
                  onChange={e => setCustomHeadline(e.target.value)}
                  placeholder="Или введите свой заголовок..."
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-graphite placeholder:text-dusk/40 outline-none transition-colors bg-cream ${
                    customHeadline.trim() ? 'border-graphite' : 'border-parchment focus:border-graphite/40'
                  }`}
                />
              </div>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={!activeHeadline || isDownloading}
              className="w-full bg-graphite text-white rounded-2xl py-4 text-sm font-semibold hover:opacity-90 disabled:opacity-35 transition-all flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="flex gap-1">
                    {[0, 100, 200].map(d => <span key={d} className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                  Создаю файл...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Скачать изображение
                </>
              )}
            </button>

            {!activeHeadline && (
              <p className="text-center text-xs text-dusk/50 mt-2">Выберите или введите заголовок</p>
            )}
          </div>
        )}

        {/* No salon_id warning */}
        {!salonId && step === 'goal' && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Данные салона не загружены. Перейдите из раздела «Действия».
          </div>
        )}

      </div>
    </div>
  )
}
