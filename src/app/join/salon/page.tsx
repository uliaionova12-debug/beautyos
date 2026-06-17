'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Upload, CheckCircle, AlertCircle, Loader2, ArrowLeft,
  PlugZap, FileSpreadsheet, PenLine, Users,
} from 'lucide-react'
import Link from 'next/link'

type Stage = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'
type View = 'select' | 'csv' | 'dikidi' | 'dikidi-clients'

export default function JoinSalonPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const existingSalonId = searchParams.get('salon_id') || ''
  const inputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<View>('select')
  const [stage, setStage] = useState<Stage>('idle')
  const [fileName, setFileName] = useState('')
  const [salonName, setSalonName] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [stepIdx, setStepIdx] = useState(0)

  const PROCESSING_STEPS = [
    'Анализ клиентов...',
    'Анализ записей...',
    'Построение модели бизнеса...',
    'Расчёт финансовых потоков...',
  ]

  useEffect(() => {
    if (stage !== 'uploading' && stage !== 'analyzing') return
    setStepIdx(0)
    const id = setInterval(() => setStepIdx(i => (i + 1) % PROCESSING_STEPS.length), 1400)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Нужен файл в формате CSV')
      setStage('error')
      return
    }
    // Auto-detect Dikidi clients CSV by peeking at the first line
    try {
      const firstChunk = await file.slice(0, 2000).text()
      if (firstChunk.includes('Последний визит') && firstChunk.includes(';')) {
        return handleDikidiClientsFile(file)
      }
    } catch { /* ignore peek errors, fall through to normal upload */ }

    setFileName(file.name)
    setStage('uploading')
    setProgress('Читаю файл...')
    const form = new FormData()
    form.append('file', file)
    form.append('salon_name', salonName || 'Мой салон')
    if (existingSalonId) form.append('salon_id', existingSalonId)
    try {
      setStage('analyzing')
      setProgress('Анализирую клиентскую базу...')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка загрузки'); setStage('error'); return }
      setStage('done')
      setTimeout(() => router.push(`/dashboard?salon_id=${data.salon_id}`), 1200)
    } catch {
      setError('Не удалось загрузить файл. Проверьте подключение.')
      setStage('error')
    }
  }

  async function handleDikidiClientsFile(file: File) {
    setFileName(file.name)
    setStage('uploading')
    setProgress('Читаю клиентскую базу...')
    const form = new FormData()
    form.append('file', file)
    form.append('salon_name', salonName || 'Мой салон')
    if (existingSalonId) form.append('salon_id', existingSalonId)
    try {
      setStage('analyzing')
      setProgress('Анализирую клиентов...')
      const res = await fetch('/api/upload-clients', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка загрузки'); setStage('error'); return }
      setStage('done')
      setTimeout(() => router.push(`/dashboard?salon_id=${data.salon_id}`), 1200)
    } catch {
      setError('Не удалось загрузить файл. Проверьте подключение.')
      setStage('error')
    }
  }

  async function handleDikidiFiles(files: FileList) {
    const fileArr = Array.from(files)
    setStage('uploading')
    setProgress('Загружаю библиотеку...')

    // Parse XLS in the browser — avoids Vercel serverless bundling issues
    let XLSX: typeof import('xlsx')
    try {
      XLSX = await import('xlsx')
    } catch {
      setError('Не удалось загрузить конвертер XLS. Попробуйте обновить страницу.')
      setStage('error')
      return
    }

    function parseBookingCell(cellText: string, master: string, dateStr: string) {
      const lines = cellText.split('\n').map((l: string) => l.trim()).filter(Boolean)
      if (lines.length < 2) return null
      const amountMatch = lines[0].match(/\(([\d\s]+)\s*RUB\)/)
      const amount = amountMatch ? amountMatch[1].replace(/\s/g, '') : '0'
      let clientName = '', phone = ''
      const serviceParts: string[] = []
      for (const line of lines.slice(1)) {
        if (/^[78]\d{10}$/.test(line.replace(/\D/g, ''))) {
          const digits = line.replace(/\D/g, '')
          phone = digits.startsWith('8') ? '7' + digits.slice(1) : digits
        } else if (!clientName) { clientName = line }
        else if (!/^(долг|потреб|могу|4ног)/i.test(line)) { serviceParts.push(line) }
      }
      if (!clientName) return null
      const [d, m, y] = dateStr.split('.')
      return { client_name: clientName, phone, visit_date: `${y}-${m}-${d}`, master_name: master, service_name: serviceParts.join(', '), amount }
    }

    const allRows: object[] = []

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i]
      setFileName(`${file.name} (${i + 1}/${fileArr.length})`)
      setProgress(`Читаю ${file.name}...`)

      try {
        const buffer = await file.arrayBuffer()
        const wb = XLSX.read(buffer, { type: 'array' })

        for (const sheetName of wb.SheetNames) {
          if (!/^\d{2}\.\d{2}\.\d{4}$/.test(sheetName)) continue
          const ws = wb.Sheets[sheetName]
          const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
          if (grid.length < 2) continue
          const masters = grid[0].slice(1).map((v: string) => String(v).trim()).filter(Boolean)
          for (let r = 1; r < grid.length; r++) {
            for (let ci = 0; ci < masters.length; ci++) {
              const cellVal = String(grid[r][ci + 1] || '').trim()
              if (!cellVal) continue
              const rec = parseBookingCell(cellVal, masters[ci], sheetName)
              if (rec) allRows.push(rec)
            }
          }
        }
      } catch {
        setError(`Не удалось прочитать файл ${file.name}`)
        setStage('error')
        return
      }
    }

    if (allRows.length === 0) {
      setError('В файлах не найдено записей клиентов')
      setStage('error')
      return
    }

    setStage('analyzing')
    setProgress(`Анализирую ${allRows.length} записей...`)

    try {
      const res = await fetch('/api/upload-dikidi-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: allRows, salon_name: salonName || 'Мой салон', salon_id: existingSalonId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка анализа'); setStage('error'); return }
      setStage('done')
      setTimeout(() => router.push(`/dashboard?salon_id=${data.salon_id}`), 1200)
    } catch {
      setError('Не удалось отправить данные на сервер.')
      setStage('error')
    }
  }

  // ── Source selection screen ──
  if (view === 'select') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          <div className="mb-8">
            <Link href="/explain" className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors">
              <ArrowLeft size={14} />
              Назад
            </Link>
          </div>

          <div className="mb-10">
            <p className="text-base font-semibold text-graphite">BeautyOS</p>
            <h1 className="text-xl font-semibold text-graphite mt-2">Загрузка данных</h1>
            <p className="text-sm text-dusk mt-1">Выберите способ, который подходит вам сейчас.</p>
          </div>

          <div className="space-y-3">

            {/* Manual */}
            <button
              onClick={() => router.push('/join/manual' + (existingSalonId ? `?salon_id=${existingSalonId}` : ''))}
              className="w-full text-left bg-card border border-parchment rounded-2xl p-5 hover:border-graphite/25 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-parchment rounded-xl flex items-center justify-center shrink-0">
                  <PenLine size={18} className="text-dusk" />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-graphite">Начать вручную</p>
                  <p className="text-xs text-dusk mt-1 leading-snug">
                    Для мастеров без CRM — добавьте несколько клиентов и получите первый анализ за 3 минуты.
                  </p>
                </div>
              </div>
            </button>

            {/* Dikidi schedule */}
            <button
              onClick={() => setView('dikidi')}
              className="w-full text-left bg-card border border-parchment rounded-2xl p-5 hover:border-sage/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-cream border border-parchment rounded-xl flex items-center justify-center shrink-0 group-hover:border-sage/30 transition-colors">
                  <FileSpreadsheet size={18} className="text-sage" />
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-graphite">Расписание из Dikidi</p>
                  </div>
                  <p className="text-xs text-dusk mt-1 leading-snug">
                    Файл расписания (.xls) — конвертируем автоматически и покажем аналитику по мастерам.
                  </p>
                </div>
              </div>
            </button>

            {/* Dikidi clients */}
            <button
              onClick={() => setView('dikidi-clients')}
              className="w-full text-left bg-card border border-parchment rounded-2xl p-5 hover:border-sage/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-cream border border-parchment rounded-xl flex items-center justify-center shrink-0 group-hover:border-sage/30 transition-colors">
                  <Users size={18} className="text-sage" />
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-graphite">Клиентская база из Dikidi</p>
                  </div>
                  <p className="text-xs text-dusk mt-1 leading-snug">
                    Файл клиентов (CSV) — покажем кто потерян, кому позвонить и финансовый ущерб.
                  </p>
                </div>
              </div>
            </button>

            {/* CSV */}
            <button
              onClick={() => setView('csv')}
              className="w-full text-left bg-card border border-parchment rounded-2xl p-5 hover:border-sage/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-cream border border-parchment rounded-xl flex items-center justify-center shrink-0 group-hover:border-sage/30 transition-colors">
                  <FileSpreadsheet size={18} className="text-sage" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-graphite">Загрузить CSV</p>
                  <p className="text-xs text-dusk mt-1 leading-snug">
                    Выгрузка из YClients или любой таблицы в формате CSV.
                  </p>
                </div>
              </div>
            </button>

            {/* CRM — coming soon */}
            <div className="w-full text-left bg-card/60 border border-parchment/60 rounded-2xl p-5 opacity-60 cursor-not-allowed">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-cream border border-parchment rounded-xl flex items-center justify-center shrink-0">
                  <PlugZap size={18} className="text-dusk/40" />
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-dusk/70">Подключить CRM</p>
                    <span className="text-[10px] font-bold tracking-wider text-dusk/50 uppercase bg-parchment px-2 py-0.5 rounded-full">Скоро</span>
                  </div>
                  <p className="text-xs text-dusk/50 mt-1 leading-snug">
                    Прямое подключение Dikidi, YClients и других систем — без выгрузки файлов.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <p className="text-xs text-dusk/50 text-center mt-10">
            Хотите посмотреть демо?{' '}
            <button
              onClick={async () => {
                setView('csv')
                const res = await fetch('/sample_salon.csv')
                const blob = await res.blob()
                const file = new File([blob], 'sample_salon.csv', { type: 'text/csv' })
                setSalonName('Демо-салон Лотос')
                setTimeout(() => handleFile(file), 100)
              }}
              className="text-sage hover:opacity-80 transition-opacity font-semibold"
            >
              Запустить на демо-данных →
            </button>
          </p>

        </div>
      </div>
    )
  }

  // ── Dikidi upload screen ──
  if (view === 'dikidi') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <button
              onClick={() => { setView('select'); setStage('idle'); setError('') }}
              className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors"
            >
              <ArrowLeft size={14} />
              Назад
            </button>
          </div>

          <div className="text-center mb-10">
            <p className="text-base font-semibold text-graphite">BeautyOS</p>
            <h1 className="text-xl font-semibold text-graphite mt-3 mb-2">Загрузите файл из Dikidi</h1>
            <p className="text-sm text-dusk leading-relaxed max-w-xs mx-auto">
              Файл расписания — скачайте его в Dikidi и загрузите сюда. Мы сконвертируем автоматически.
            </p>
          </div>

          <div className="bg-card border border-parchment rounded-2xl p-8 shadow-sm">

            {stage === 'idle' && (() => {
              const dikidiRef = { current: null as HTMLInputElement | null }
              return (
                <>
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-dusk mb-2 tracking-wide">Название салона</label>
                    <input
                      type="text"
                      value={salonName}
                      onChange={e => setSalonName(e.target.value)}
                      placeholder="Например: Лотос"
                      className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage/60 transition-colors"
                    />
                  </div>

                  <input
                    ref={el => { dikidiRef.current = el }}
                    type="file"
                    multiple
                    accept=".xls,.xlsx,application/vnd.ms-excel,application/octet-stream,*/*"
                    className="hidden"
                    onChange={e => { if (e.target.files?.length) handleDikidiFiles(e.target.files) }}
                  />

                  <button
                    onClick={() => dikidiRef.current?.click()}
                    className="w-full border-2 border-dashed border-parchment hover:border-sage/40 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors group"
                  >
                    <Upload size={22} className="text-dusk/40 group-hover:text-sage transition-colors" />
                    <span className="text-sm text-dusk group-hover:text-graphite transition-colors font-medium">Нажмите, чтобы выбрать файлы</span>
                    <span className="text-xs text-dusk/40">Можно выбрать сразу несколько файлов</span>
                  </button>
                </>
              )
            })()}

            {(stage === 'uploading' || stage === 'analyzing') && (
              <div className="flex flex-col items-center py-8 gap-5">
                <Loader2 size={32} className="text-sage animate-spin" />
                <div className="w-full space-y-2">
                  {PROCESSING_STEPS.map((step, i) => (
                    <div key={step} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${i === stepIdx ? 'bg-sage/10' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === stepIdx ? 'bg-sage animate-pulse' : i < stepIdx ? 'bg-sage/40' : 'bg-parchment'}`} />
                      <p className={`text-sm transition-colors ${i === stepIdx ? 'text-graphite font-medium' : i < stepIdx ? 'text-dusk/60' : 'text-dusk/30'}`}>{step}</p>
                    </div>
                  ))}
                </div>
                {fileName && <p className="text-xs text-dusk/40">{fileName}</p>}
              </div>
            )}

            {stage === 'done' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <CheckCircle size={32} className="text-sage" />
                <div className="text-center">
                  <p className="text-graphite font-medium">Анализ завершён</p>
                  <p className="text-dusk text-sm mt-1">Формирую карту бизнеса...</p>
                </div>
              </div>
            )}

            {stage === 'error' && (
              <div className="flex flex-col items-center py-6 gap-4">
                <AlertCircle size={32} className="text-terracotta" />
                <div className="text-center">
                  <p className="text-graphite font-medium">Ошибка</p>
                  <p className="text-dusk text-sm mt-1">{error}</p>
                </div>
                <button onClick={() => { setStage('idle'); setError('') }}
                  className="text-sm text-sage hover:opacity-80 transition-opacity font-medium">
                  Попробовать снова
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    )
  }

  // ── Dikidi clients upload screen ──
  if (view === 'dikidi-clients') {
    const clientsRef = { current: null as HTMLInputElement | null }
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <button
              onClick={() => { setView('select'); setStage('idle'); setError('') }}
              className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors"
            >
              <ArrowLeft size={14} />
              Назад
            </button>
          </div>

          <div className="text-center mb-10">
            <p className="text-base font-semibold text-graphite">BeautyOS</p>
            <h1 className="text-xl font-semibold text-graphite mt-3 mb-2">Клиентская база из Dikidi</h1>
            <p className="text-sm text-dusk leading-relaxed max-w-xs mx-auto">
              Скачайте в Dikidi: Клиенты → Экспорт CSV. Мы покажем кто потерян и кому позвонить первым.
            </p>
          </div>

          <div className="bg-card border border-parchment rounded-2xl p-8 shadow-sm">

            {stage === 'idle' && (() => (
              <>
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-dusk mb-2 tracking-wide">Название салона</label>
                  <input
                    type="text"
                    value={salonName}
                    onChange={e => setSalonName(e.target.value)}
                    placeholder="Например: Rose Парнас"
                    className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage/60 transition-colors"
                  />
                </div>

                <input
                  ref={el => { clientsRef.current = el }}
                  type="file"
                  accept=".csv,text/csv,text/plain,*/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleDikidiClientsFile(f) }}
                />

                <button
                  onClick={() => clientsRef.current?.click()}
                  className="w-full border-2 border-dashed border-parchment hover:border-sage/40 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors group"
                >
                  <Upload size={22} className="text-dusk/40 group-hover:text-sage transition-colors" />
                  <span className="text-sm text-dusk group-hover:text-graphite transition-colors font-medium">Нажмите, чтобы выбрать CSV</span>
                  <span className="text-xs text-dusk/40">Файл clients_ДАТА.csv из Dikidi</span>
                </button>
              </>
            ))()}

            {(stage === 'uploading' || stage === 'analyzing') && (
              <div className="flex flex-col items-center py-8 gap-5">
                <Loader2 size={32} className="text-sage animate-spin" />
                <div className="w-full space-y-2">
                  {PROCESSING_STEPS.map((step, i) => (
                    <div key={step} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${i === stepIdx ? 'bg-sage/10' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === stepIdx ? 'bg-sage animate-pulse' : i < stepIdx ? 'bg-sage/40' : 'bg-parchment'}`} />
                      <p className={`text-sm transition-colors ${i === stepIdx ? 'text-graphite font-medium' : i < stepIdx ? 'text-dusk/60' : 'text-dusk/30'}`}>{step}</p>
                    </div>
                  ))}
                </div>
                {fileName && <p className="text-xs text-dusk/40">{fileName}</p>}
              </div>
            )}

            {stage === 'done' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <CheckCircle size={32} className="text-sage" />
                <div className="text-center">
                  <p className="text-graphite font-medium">Анализ завершён</p>
                  <p className="text-dusk text-sm mt-1">Формирую карту бизнеса...</p>
                </div>
              </div>
            )}

            {stage === 'error' && (
              <div className="flex flex-col items-center py-6 gap-4">
                <AlertCircle size={32} className="text-terracotta" />
                <div className="text-center">
                  <p className="text-graphite font-medium">Ошибка</p>
                  <p className="text-dusk text-sm mt-1">{error}</p>
                </div>
                <button onClick={() => { setStage('idle'); setError('') }}
                  className="text-sm text-sage hover:opacity-80 transition-opacity font-medium">
                  Попробовать снова
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    )
  }

  // ── CSV upload screen ──
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="mb-8">
          <button
            onClick={() => { setView('select'); setStage('idle'); setError('') }}
            className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors"
          >
            <ArrowLeft size={14} />
            Назад
          </button>
        </div>

        <div className="text-center mb-10">
          <p className="text-base font-semibold text-graphite">BeautyOS</p>
          <h1 className="text-xl font-semibold text-graphite mt-3 mb-2">Загрузите файл</h1>
          <p className="text-sm text-dusk leading-relaxed max-w-xs mx-auto">
            Выгрузка из YClients или Dikidi — покажем финансовый ущерб от ухода клиентов за 60 секунд.
          </p>
        </div>

        <div className="bg-card border border-parchment rounded-2xl p-8 shadow-sm">

          {stage === 'idle' && (
            <>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-dusk mb-2 tracking-wide">Название салона</label>
                <input
                  type="text"
                  value={salonName}
                  onChange={e => setSalonName(e.target.value)}
                  placeholder="Например: Лотос"
                  className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage/60 transition-colors"
                />
              </div>

              <input ref={inputRef} type="file" accept=".csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

              <button
                onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed border-parchment hover:border-sage/40 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors group"
              >
                <Upload size={22} className="text-dusk/40 group-hover:text-sage transition-colors" />
                <span className="text-sm text-dusk group-hover:text-graphite transition-colors font-medium">Нажмите, чтобы выбрать CSV</span>
                <span className="text-xs text-dusk/40">YClients · Dikidi · любой CSV с визитами</span>
              </button>
            </>
          )}

          {(stage === 'uploading' || stage === 'analyzing') && (
            <div className="flex flex-col items-center py-8 gap-5">
              <Loader2 size={32} className="text-sage animate-spin" />
              <div className="w-full space-y-2">
                {PROCESSING_STEPS.map((step, i) => (
                  <div key={step} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${i === stepIdx ? 'bg-sage/10' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === stepIdx ? 'bg-sage animate-pulse' : i < stepIdx ? 'bg-sage/40' : 'bg-parchment'}`} />
                    <p className={`text-sm transition-colors ${i === stepIdx ? 'text-graphite font-medium' : i < stepIdx ? 'text-dusk/60' : 'text-dusk/30'}`}>{step}</p>
                  </div>
                ))}
              </div>
              {fileName && <p className="text-xs text-dusk/40">{fileName}</p>}
            </div>
          )}

          {stage === 'done' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <CheckCircle size={32} className="text-sage" />
              <div className="text-center">
                <p className="text-graphite font-medium">Анализ завершён</p>
                <p className="text-dusk text-sm mt-1">Формирую карту бизнеса...</p>
              </div>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center py-6 gap-4">
              <AlertCircle size={32} className="text-terracotta" />
              <div className="text-center">
                <p className="text-graphite font-medium">Ошибка</p>
                <p className="text-dusk text-sm mt-1">{error}</p>
              </div>
              <button onClick={() => { setStage('idle'); setError('') }}
                className="text-sm text-sage hover:opacity-80 transition-opacity font-medium">
                Попробовать снова
              </button>
            </div>
          )}

        </div>

        {stage === 'idle' && (
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { value: '60 сек', label: 'до первого инсайта' },
              { value: '35–45%', label: 'отток клиентов в год' },
              { value: '7+ млн ₽', label: 'теряет салон незаметно' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-graphite font-bold text-lg">{stat.value}</p>
                <p className="text-dusk/60 text-xs leading-tight mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
