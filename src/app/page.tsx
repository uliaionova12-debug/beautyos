'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type Stage = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

export default function HomePage() {
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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">BeautyOS</h1>
          <p className="text-zinc-500 text-sm">
            AI Operating System для салонов красоты
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

          {stage === 'idle' && (
            <>
              <div className="mb-6">
                <p className="text-white font-semibold text-lg mb-1">
                  Узнайте, сколько денег теряет ваш салон
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Загрузите выгрузку из YClients или Dikidi — мы покажем финансовый ущерб от ухода клиентов за 60 секунд.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                  Название салона
                </label>
                <input
                  type="text"
                  value={salonName}
                  onChange={e => setSalonName(e.target.value)}
                  placeholder="Например: Лотос"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
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
                className="w-full border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors group"
              >
                <Upload size={24} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                <span className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  Нажмите, чтобы выбрать CSV
                </span>
                <span className="text-xs text-zinc-700">
                  YClients · Dikidi · любой CSV с визитами
                </span>
              </button>

              <p className="text-xs text-zinc-700 text-center mt-4">
                Нет файла?{' '}
                <button
                  onClick={async () => {
                    const res = await fetch('/sample_salon.csv')
                    const blob = await res.blob()
                    const file = new File([blob], 'sample_salon.csv', { type: 'text/csv' })
                    setSalonName('Демо-салон Лотос')
                    handleFile(file)
                  }}
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Запустить на демо-данных
                </button>
              </p>
            </>
          )}

          {(stage === 'uploading' || stage === 'analyzing') && (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 size={32} className="text-blue-400 animate-spin" />
              <div className="text-center">
                <p className="text-white font-medium">{progress}</p>
                <p className="text-zinc-500 text-sm mt-1">{fileName}</p>
              </div>
            </div>
          )}

          {stage === 'done' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <CheckCircle size={32} className="text-emerald-400" />
              <div className="text-center">
                <p className="text-white font-medium">Анализ завершён</p>
                <p className="text-zinc-500 text-sm mt-1">Открываю дашборд...</p>
              </div>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center py-6 gap-4">
              <AlertCircle size={32} className="text-red-400" />
              <div className="text-center">
                <p className="text-white font-medium">Ошибка</p>
                <p className="text-zinc-500 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => { setStage('idle'); setError('') }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>

        {stage === 'idle' && (
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {[
              { value: '60 сек', label: 'до первого инсайта' },
              { value: '35–45%', label: 'отток клиентов в год' },
              { value: '7+ млн ₽', label: 'теряет салон незаметно' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-zinc-600 text-xs leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
