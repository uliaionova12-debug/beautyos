'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Stage = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

export default function JoinSalonPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [fileName, setFileName] = useState('')
  const [salonName, setSalonName] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Нужен файл в формате CSV')
      setStage('error')
      return
    }

    setFileName(file.name)
    setStage('uploading')
    setProgress('Читаю файл...')

    const form = new FormData()
    form.append('file', file)
    form.append('salon_name', salonName || 'Мой салон')

    try {
      setStage('analyzing')
      setProgress('Анализирую клиентскую базу...')

      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ошибка загрузки')
        setStage('error')
        return
      }

      setStage('done')
      setTimeout(() => {
        router.push(`/dashboard?salon_id=${data.salon_id}`)
      }, 1200)
    } catch {
      setError('Не удалось загрузить файл. Проверьте подключение.')
      setStage('error')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="mb-8">
          <Link
            href="/role"
            className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors"
          >
            <ArrowLeft size={14} />
            Назад
          </Link>
        </div>

        <div className="text-center mb-10">
          <p className="text-base font-semibold text-graphite">BeautyOS</p>
          <h1 className="text-xl font-semibold text-graphite mt-3 mb-2">Начнём с данных</h1>
          <p className="text-sm text-dusk leading-relaxed max-w-xs mx-auto">
            Загрузите выгрузку из YClients или Dikidi — покажем финансовый ущерб от ухода клиентов за 60 секунд.
          </p>
        </div>

        <div className="bg-card border border-parchment rounded-2xl p-8 shadow-sm">

          {stage === 'idle' && (
            <>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-dusk mb-2 tracking-wide">
                  Название салона
                </label>
                <input
                  type="text"
                  value={salonName}
                  onChange={e => setSalonName(e.target.value)}
                  placeholder="Например: Лотос"
                  className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage/60 transition-colors"
                />
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />

              <button
                onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed border-parchment hover:border-sage/40 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors group"
              >
                <Upload size={22} className="text-dusk/40 group-hover:text-sage transition-colors" />
                <span className="text-sm text-dusk group-hover:text-graphite transition-colors font-medium">
                  Нажмите, чтобы выбрать CSV
                </span>
                <span className="text-xs text-dusk/40">
                  YClients · Dikidi · любой CSV с визитами
                </span>
              </button>

              <p className="text-xs text-dusk/50 text-center mt-5">
                Нет файла?{' '}
                <button
                  onClick={async () => {
                    const res = await fetch('/sample_salon.csv')
                    const blob = await res.blob()
                    const file = new File([blob], 'sample_salon.csv', { type: 'text/csv' })
                    setSalonName('Демо-салон Лотос')
                    handleFile(file)
                  }}
                  className="text-sage hover:opacity-80 transition-opacity font-semibold"
                >
                  Запустить на демо-данных
                </button>
              </p>
            </>
          )}

          {(stage === 'uploading' || stage === 'analyzing') && (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 size={32} className="text-sage animate-spin" />
              <div className="text-center">
                <p className="text-graphite font-medium">{progress}</p>
                <p className="text-dusk text-sm mt-1">{fileName}</p>
              </div>
            </div>
          )}

          {stage === 'done' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <CheckCircle size={32} className="text-sage" />
              <div className="text-center">
                <p className="text-graphite font-medium">Анализ завершён</p>
                <p className="text-dusk text-sm mt-1">Открываю дашборд...</p>
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
              <button
                onClick={() => { setStage('idle'); setError('') }}
                className="text-sm text-sage hover:opacity-80 transition-opacity font-medium"
              >
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
