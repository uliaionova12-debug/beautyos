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

type FormatId     = typeof FORMATS[number]['id']
type Step         = 'goal' | 'platform' | 'format' | 'result' | 'visual' | 'compose'
type VisualChoice = 'photos' | 'generate' | null
type ImageSizeId  = 'ig_post' | 'ig_story' | 'telegram' | 'vk'
type StylePresetId = 'soft_luxury' | 'minimal' | 'editorial' | 'magazine' | 'premium'
type PositionId   = 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right'

interface Message { role: 'user' | 'assistant'; content: string }

interface StylePreset {
  label:         string
  fontFamily:    string
  fontWeight:    string
  textTransform: 'none' | 'uppercase'
  letterSpacing: string
  color:         string
  gradientOpacity: number
  defaultPosition: PositionId
}

const SUPPORTS_VISUAL = new Set<FormatId>(['post', 'photo_series', 'stories'])

const IMAGE_SIZES: { id: ImageSizeId; label: string; aspect: string; w: number; h: number }[] = [
  { id: 'ig_post',  label: 'Instagram',  aspect: '1/1',  w: 1080, h: 1080 },
  { id: 'ig_story', label: 'Stories',    aspect: '9/16', w: 1080, h: 1920 },
  { id: 'telegram', label: 'Telegram',   aspect: '16/9', w: 1280, h: 720  },
  { id: 'vk',       label: 'ВКонтакте', aspect: '16/9', w: 1200, h: 628  },
]

const STYLE_PRESETS: Record<StylePresetId, StylePreset> = {
  soft_luxury: {
    label: 'Soft Luxury',
    fontFamily: 'Playfair Display',
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: '0.02em',
    color: '#FFFFFF',
    gradientOpacity: 0.65,
    defaultPosition: 'bottom-left',
  },
  minimal: {
    label: 'Minimal',
    fontFamily: 'Manrope',
    fontWeight: '300',
    textTransform: 'none',
    letterSpacing: '-0.01em',
    color: '#FFFFFF',
    gradientOpacity: 0.38,
    defaultPosition: 'bottom-center',
  },
  editorial: {
    label: 'Editorial',
    fontFamily: 'Manrope',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#FFFFFF',
    gradientOpacity: 0.75,
    defaultPosition: 'bottom-left',
  },
  magazine: {
    label: 'Magazine',
    fontFamily: 'Playfair Display',
    fontWeight: '700',
    textTransform: 'none',
    letterSpacing: '0.01em',
    color: '#FFFFFF',
    gradientOpacity: 0.78,
    defaultPosition: 'bottom-center',
  },
  premium: {
    label: 'Premium',
    fontFamily: 'Manrope',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: '#F5E6D0',
    gradientOpacity: 0.82,
    defaultPosition: 'bottom-left',
  },
}

// 3×3 grid; null = disabled cell (middle-left and middle-right)
const POSITION_GRID: ({ id: PositionId; arrow: string } | null)[][] = [
  [
    { id: 'top-left',    arrow: '↖' },
    { id: 'top-center',  arrow: '↑' },
    { id: 'top-right',   arrow: '↗' },
  ],
  [
    null,
    { id: 'center',      arrow: '✦' },
    null,
  ],
  [
    { id: 'bottom-left',   arrow: '↙' },
    { id: 'bottom-center', arrow: '↓' },
    { id: 'bottom-right',  arrow: '↘' },
  ],
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
// Compact single-line trail. Taps navigate back; each segment has 36px min height.

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
    <div className="flex items-center gap-0.5 mb-5 overflow-hidden">
      <button
        onClick={() => onGoTo('goal')}
        className="inline-flex items-center gap-1 text-[11px] text-terracotta/80 hover:text-terracotta py-2 px-1.5 rounded-lg transition-colors shrink-0 min-h-[36px]"
      >
        <span>{goal.emoji}</span>
        <span className="font-medium max-w-[72px] truncate">{goal.label}</span>
      </button>
      {platform && (
        <>
          <ChevronRight size={10} className="text-dusk/25 shrink-0" />
          <button
            onClick={() => onGoTo('platform')}
            className="inline-flex items-center gap-0.5 text-[11px] text-dusk/60 hover:text-terracotta py-2 px-1.5 rounded-lg transition-colors shrink-0 min-h-[36px]"
          >
            <span>{platform.emoji}</span>
          </button>
        </>
      )}
      {format && (
        <>
          <ChevronRight size={10} className="text-dusk/25 shrink-0" />
          <button
            onClick={() => onGoTo('format')}
            className="text-[11px] text-dusk/60 hover:text-terracotta py-2 px-1.5 rounded-lg transition-colors shrink-0 min-h-[36px]"
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
  const [stylePreset, setStylePreset]           = useState<StylePresetId>('soft_luxury')
  const [textPosition, setTextPosition]         = useState<PositionId>('bottom-left')
  const [secondLine, setSecondLine]             = useState('')
  const [isAutoStyling, setIsAutoStyling]       = useState(false)
  const [autoStyleReason, setAutoStyleReason]   = useState('')

  const bottomRef     = useRef<HTMLDivElement>(null)
  const photoInputRef  = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

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
    setSecondLine('')
    setStylePreset('soft_luxury')
    setTextPosition('bottom-left')
    setAutoStyleReason('')
    setIsAnalyzing(false)
    setIsGenerating(false)
    setIsAutoStyling(false)
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

  async function handleAutoStyle() {
    if (!selectedImage || isAutoStyling) return
    setIsAutoStyling(true)
    setAutoStyleReason('')
    try {
      const lastAi = messages.filter(m => m.role === 'assistant').slice(-1)[0]
      const res = await fetch('/api/marketing-agent/auto-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl: selectedImage,
          goal: selectedGoal?.id || '',
          postText: lastAi?.content?.slice(0, 200) || '',
        }),
      })
      const data = await res.json()
      if (data.preset && STYLE_PRESETS[data.preset as StylePresetId]) {
        setStylePreset(data.preset as StylePresetId)
      }
      if (data.position) {
        setTextPosition(data.position as PositionId)
      }
      if (data.reason) setAutoStyleReason(data.reason)
    } catch {
      // silently keep current settings
    } finally {
      setIsAutoStyling(false)
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
        const detail = data.error ? ` (${data.error})` : ''
        setGenerationError(`Изображение не создалось${detail}. Попробуйте ещё раз.`)
      }
    } catch {
      setGenerationError('Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.')
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

      const preset = STYLE_PRESETS[stylePreset]
      const pos = textPosition

      await new Promise<void>(resolve => {
        const img = new Image()
        img.onload = () => {
          // — draw image —
          const scale = Math.max(w / img.width, h / img.height)
          const iw = img.width * scale
          const ih = img.height * scale
          ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih)

          // — gradient overlay based on position —
          const opacity = preset.gradientOpacity
          if (pos.startsWith('top')) {
            const grad = ctx.createLinearGradient(0, 0, 0, h * 0.58)
            grad.addColorStop(0, `rgba(0,0,0,${opacity})`)
            grad.addColorStop(1, 'rgba(0,0,0,0)')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, w, h)
          } else if (pos === 'center') {
            const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.15, w / 2, h / 2, h * 0.65)
            grad.addColorStop(0, `rgba(0,0,0,${opacity * 0.5})`)
            grad.addColorStop(1, `rgba(0,0,0,${opacity})`)
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, w, h)
          } else {
            const grad = ctx.createLinearGradient(0, h * 0.38, 0, h)
            grad.addColorStop(0, 'rgba(0,0,0,0)')
            grad.addColorStop(1, `rgba(0,0,0,${opacity})`)
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, w, h)
          }

          // — text rendering helpers —
          ctx.textBaseline = 'top'
          ctx.fillStyle = preset.color
          ctx.shadowBlur = 12
          ctx.shadowColor = 'rgba(0,0,0,0.4)'

          const pad = Math.round(w * 0.046)
          const maxTextW = w - pad * 2

          function wrapText(text: string, fontSize: number): string[] {
            const words = text.split(' ')
            const wrapped: string[] = []
            let line = ''
            for (const word of words) {
              const test = line + word + ' '
              if (ctx.measureText(test).width > maxTextW && line) {
                wrapped.push(line.trim())
                line = word + ' '
              } else {
                line = test
              }
            }
            if (line.trim()) wrapped.push(line.trim())
            return wrapped
          }

          function applyFont(size: number, weight: string) {
            const family = preset.fontFamily === 'Playfair Display'
              ? '"Playfair Display", Georgia, serif'
              : 'Manrope, -apple-system, system-ui, sans-serif'
            ctx.font = `${weight} ${size}px ${family}`
            if ('letterSpacing' in ctx) {
              // convert em to px
              const emVal = parseFloat(preset.letterSpacing)
              ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(emVal * size)}px`
            }
          }

          // — headline —
          const fontSize = Math.round(w * 0.052)
          applyFont(fontSize, preset.fontWeight)
          const displayHeadline = preset.textTransform === 'uppercase' ? headline.toUpperCase() : headline
          const lines = wrapText(displayHeadline, fontSize)
          const lineH = fontSize * 1.28

          // — optional second line —
          const hasSecond = secondLine.trim().length > 0
          const fontSize2 = Math.round(fontSize * 0.62)
          const lineH2 = fontSize2 * 1.3
          let lines2: string[] = []
          if (hasSecond) {
            applyFont(fontSize2, '400')
            const displaySecond = preset.textTransform === 'uppercase' ? secondLine.trim().toUpperCase() : secondLine.trim()
            lines2 = wrapText(displaySecond, fontSize2)
          }

          const blockH = lines.length * lineH + (hasSecond ? 8 + lines2.length * lineH2 : 0)

          // — text anchor point —
          let startX: number
          let startY: number
          let align: CanvasTextAlign

          if (pos === 'top-left')      { startX = pad;     startY = pad;              align = 'left'   }
          else if (pos === 'top-center') { startX = w / 2;  startY = pad;              align = 'center' }
          else if (pos === 'top-right')  { startX = w - pad; startY = pad;              align = 'right'  }
          else if (pos === 'center')     { startX = w / 2;  startY = (h - blockH) / 2; align = 'center' }
          else if (pos === 'bottom-left')   { startX = pad;     startY = h - pad - blockH; align = 'left'   }
          else if (pos === 'bottom-center') { startX = w / 2;   startY = h - pad - blockH; align = 'center' }
          else                              { startX = w - pad;  startY = h - pad - blockH; align = 'right'  }

          ctx.textAlign = align

          // — draw headline lines —
          applyFont(fontSize, preset.fontWeight)
          lines.forEach((l, i) => ctx.fillText(l, startX, startY + i * lineH))

          // — draw second line —
          if (hasSecond && lines2.length) {
            applyFont(fontSize2, '400')
            ctx.globalAlpha = 0.82
            const secondY = startY + lines.length * lineH + 8
            lines2.forEach((l, i) => ctx.fillText(l, startX, secondY + i * lineH2))
            ctx.globalAlpha = 1
          }

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
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/actions?salon_id=${salonId}`}
            className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-graphite transition-colors -ml-2 px-2 py-3 rounded-xl"
          >
            <ArrowLeft size={16} />
            Действия
          </Link>
          <div className="text-center">
            <p className="text-sm font-semibold text-graphite">
              {step === 'compose' ? 'AI Content Studio' : 'Директор по маркетингу'}
            </p>
            <p className="text-[10px] text-dusk/60">
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
              className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-graphite transition-colors -ml-2 px-2 py-3 rounded-xl mb-4"
            >
              <ArrowLeft size={16} />
              Назад к тексту
            </button>

            <h2 className="text-xl font-bold text-graphite mb-1">Создать изображение</h2>
            <p className="text-sm text-dusk mb-5">Как будем создавать визуал?</p>

            {/* Source choice — shown when nothing selected yet */}
            {!visualChoice && (
              <div className="space-y-2.5">
                {/* AI Generate */}
                <button
                  onClick={handleGenerateImage}
                  className="w-full flex items-center gap-4 bg-graphite text-white rounded-2xl p-5 text-left hover:opacity-95 active:scale-[0.99] transition-all group"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl shrink-0">✨</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Сгенерировать AI</p>
                    <p className="text-xs text-white/55 mt-0.5">Soft Luxury фото по содержанию поста — ~20 сек</p>
                  </div>
                  <ChevronRight size={15} className="text-white/30 shrink-0" />
                </button>

                {/* Gallery */}
                <button
                  onClick={() => { setVisualChoice('photos'); setTimeout(() => photoInputRef.current?.click(), 50) }}
                  className="w-full flex items-center gap-4 bg-card border border-parchment hover:border-terracotta/40 rounded-2xl p-5 text-left transition-all group"
                >
                  <div className="w-12 h-12 bg-terracotta/8 rounded-xl flex items-center justify-center text-2xl shrink-0">🖼</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-graphite">Выбрать из галереи</p>
                    <p className="text-xs text-dusk mt-0.5">До 5 фото — AI выберет лучшее</p>
                  </div>
                  <ChevronRight size={15} className="text-dusk/30 shrink-0" />
                </button>

                {/* Camera */}
                <button
                  onClick={() => { setVisualChoice('photos'); setTimeout(() => cameraInputRef.current?.click(), 50) }}
                  className="w-full flex items-center gap-4 bg-card border border-parchment hover:border-terracotta/40 rounded-2xl p-5 text-left transition-all group"
                >
                  <div className="w-12 h-12 bg-terracotta/8 rounded-xl flex items-center justify-center text-2xl shrink-0">📷</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-graphite">Сфотографировать</p>
                    <p className="text-xs text-dusk mt-0.5">Открыть камеру и снять прямо сейчас</p>
                  </div>
                  <ChevronRight size={15} className="text-dusk/30 shrink-0" />
                </button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
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
        {step === 'compose' && selectedImage && (() => {
          const preset  = STYLE_PRESETS[stylePreset]
          const sz      = IMAGE_SIZES.find(s => s.id === imageSize)!
          const isTop   = textPosition.startsWith('top')
          const isCenter = textPosition === 'center'

          // CSS preview gradient
          const overlayClass = isTop
            ? 'bg-gradient-to-b from-black/65 via-black/0 to-transparent'
            : isCenter
            ? 'bg-black/30'
            : 'bg-gradient-to-t from-black/65 via-transparent to-transparent'

          // CSS preview text position
          const textWrapperClass: string = {
            'top-left':      'absolute top-0 left-0 p-4 sm:p-5',
            'top-center':    'absolute top-0 left-0 right-0 p-4 sm:p-5 text-center',
            'top-right':     'absolute top-0 left-0 right-0 p-4 sm:p-5 text-right',
            'center':        'absolute inset-0 flex flex-col items-center justify-center p-4 text-center',
            'bottom-left':   'absolute bottom-0 left-0 right-0 p-4 sm:p-5',
            'bottom-center': 'absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-center',
            'bottom-right':  'absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-right',
          }[textPosition]

          const fontVar = preset.fontFamily === 'Playfair Display'
            ? 'var(--font-playfair)'
            : 'var(--font-manrope)'

          return (
            <div>
              <button
                onClick={() => setStep('visual')}
                className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-graphite transition-colors -ml-2 px-2 py-3 rounded-xl mb-3"
              >
                <ArrowLeft size={16} />
                Назад
              </button>

              {/* ── Preview ─────────────────────────── */}
              <div
                className="relative overflow-hidden rounded-2xl bg-graphite/5 mb-5 w-full"
                style={{ aspectRatio: sz.aspect, maxHeight: '72vw' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className={`absolute inset-0 ${overlayClass}`} />
                {activeHeadline && (
                  <div className={textWrapperClass}>
                    <p
                      style={{
                        fontFamily: fontVar,
                        fontWeight: preset.fontWeight,
                        textTransform: preset.textTransform,
                        letterSpacing: preset.letterSpacing,
                        color: preset.color,
                        textShadow: '0 2px 10px rgba(0,0,0,0.45)',
                      }}
                      className="text-base sm:text-lg leading-tight"
                    >
                      {activeHeadline}
                    </p>
                    {secondLine.trim() && (
                      <p
                        style={{
                          fontFamily: fontVar,
                          fontWeight: '400',
                          textTransform: preset.textTransform,
                          letterSpacing: preset.letterSpacing,
                          color: preset.color,
                          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          opacity: 0.82,
                        }}
                        className="text-xs sm:text-sm leading-snug mt-1"
                      >
                        {secondLine}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Auto-style ──────────────────────── */}
              <div className="mb-5">
                <button
                  onClick={handleAutoStyle}
                  disabled={isAutoStyling}
                  className="w-full flex items-center justify-center gap-2 bg-graphite/5 hover:bg-graphite/10 border border-parchment rounded-xl py-3 text-sm font-medium text-graphite disabled:opacity-50 transition-colors"
                >
                  {isAutoStyling ? (
                    <>
                      <div className="flex gap-1">
                        {[0, 100, 200].map(d => <span key={d} className="w-1.5 h-1.5 bg-graphite/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                      </div>
                      Анализирую фото...
                    </>
                  ) : (
                    <><Sparkles size={14} className="text-amber-500" /> ✨ Сделать как журнал</>
                  )}
                </button>
                {autoStyleReason && !isAutoStyling && (
                  <p className="text-xs text-dusk/60 italic mt-1.5 px-1">{autoStyleReason}</p>
                )}
              </div>

              {/* ── Style presets ───────────────────── */}
              <div className="mb-4">
                <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-2">Стиль</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {(Object.keys(STYLE_PRESETS) as StylePresetId[]).map(id => (
                    <button
                      key={id}
                      onClick={() => setStylePreset(id)}
                      className={`shrink-0 text-xs px-3.5 py-2 rounded-xl border transition-all ${
                        stylePreset === id
                          ? 'bg-graphite text-white border-graphite'
                          : 'bg-card border-parchment text-dusk hover:border-graphite/30 hover:text-graphite'
                      }`}
                    >
                      {STYLE_PRESETS[id].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Position grid ───────────────────── */}
              <div className="mb-5">
                <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-2">Позиция текста</p>
                <div className="inline-grid grid-cols-3 gap-1.5">
                  {POSITION_GRID.map((row, ri) =>
                    row.map((cell, ci) =>
                      cell ? (
                        <button
                          key={`${ri}-${ci}`}
                          onClick={() => setTextPosition(cell.id)}
                          title={cell.id}
                          className={`w-10 h-10 rounded-lg text-sm font-mono border transition-all ${
                            textPosition === cell.id
                              ? 'bg-graphite text-white border-graphite'
                              : 'bg-card border-parchment text-dusk/60 hover:border-graphite/30 hover:text-graphite'
                          }`}
                        >
                          {cell.arrow}
                        </button>
                      ) : (
                        <div key={`${ri}-${ci}`} className="w-10 h-10" />
                      )
                    )
                  )}
                </div>
              </div>

              {/* ── Size selector ───────────────────── */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
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

              {/* ── Headline selection ──────────────── */}
              <div className="space-y-2 mb-3">
                <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest">Заголовок</p>

                {isLoadingHeadlines ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-dusk">
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

              {/* ── Second line ─────────────────────── */}
              <div className="mb-5">
                <input
                  type="text"
                  value={secondLine}
                  onChange={e => setSecondLine(e.target.value)}
                  placeholder="Вторая строка (необязательно) — подзаголовок, CTA..."
                  className="w-full border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder:text-dusk/40 outline-none focus:border-graphite/40 transition-colors bg-cream"
                />
              </div>

              {/* ── Download ────────────────────────── */}
              {/* pb accounts for FAB + bottom safe area so button doesn't hide under them */}
              <div style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
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
                    Скачать {sz.w}×{sz.h}
                  </>
                )}
              </button>

              {!activeHeadline && (
                <p className="text-center text-xs text-dusk/50 mt-2">Выберите или введите заголовок</p>
              )}
              </div>
            </div>
          )
        })()}

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
