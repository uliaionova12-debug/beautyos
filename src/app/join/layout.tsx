import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BeautyOS — ваш личный кабинет красоты',
  description: 'Откройте личный кабинет, который помнит ваши предпочтения, хранит историю визитов и напоминает о следующей записи к мастеру.',
  openGraph: {
    title: 'BeautyOS — ваш личный кабинет красоты',
    description: 'Откройте личный кабинет, который помнит ваши предпочтения, хранит историю визитов и напоминает о следующей записи к мастеру.',
    siteName: 'BeautyOS',
  },
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
