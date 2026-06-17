'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal typings for Web Speech API (not in all TS lib versions)
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  start(): void
  stop(): void
}
interface ISpeechRecognitionCtor { new(): ISpeechRecognition }

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionCtor
    webkitSpeechRecognition?: ISpeechRecognitionCtor
  }
}

export type VoiceError = 'not_supported' | 'permission_denied' | 'no_speech' | 'network' | 'unknown'

export interface UseVoiceInputReturn {
  listening: boolean
  supported: boolean
  error: VoiceError | null
  toggle: () => void
  clearError: () => void
}

export function useVoiceInput(
  onTranscript: (text: string) => void,
  lang = 'ru-RU',
): UseVoiceInputReturn {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState<VoiceError | null>(null)
  const recRef = useRef<ISpeechRecognition | null>(null)

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }, [])

  const stop = useCallback(() => {
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) { stop(); return }

    const API = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!API) { setError('not_supported'); return }

    setError(null)
    const rec = new API()
    rec.lang            = lang
    rec.interimResults  = false
    rec.maxAlternatives = 1
    rec.continuous      = false

    rec.onstart  = () => setListening(true)
    rec.onend    = () => { setListening(false); recRef.current = null }
    rec.onerror  = (e: { error: string }) => {
      setListening(false)
      recRef.current = null
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('permission_denied')
      } else if (e.error === 'no-speech') {
        setError('no_speech')
      } else if (e.error === 'network') {
        setError('network')
      } else {
        setError('unknown')
      }
    }
    rec.onresult = (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => {
      const transcript = e.results[0]?.[0]?.transcript?.trim()
      if (transcript) onTranscript(transcript)
    }

    recRef.current = rec
    try { rec.start() } catch { setError('unknown') }
  }, [lang, listening, onTranscript, stop])

  // Cleanup on unmount
  useEffect(() => () => { recRef.current?.stop() }, [])

  return { listening, supported, error, toggle, clearError: () => setError(null) }
}
