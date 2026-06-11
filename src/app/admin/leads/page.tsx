import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

type Lead = {
  id: string
  name: string
  phone: string | null
  telegram: string | null
  business_type: string | null
  plan: string | null
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Moscow',
  })
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams
  if (key !== process.env.ADMIN_KEY) return notFound()

  const { data: leads, error } = await supabaseAdmin
    .from('leads')
    .select('id, name, phone, telegram, business_type, plan, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  return (
    <div className="min-h-screen bg-cream px-6 py-10">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-graphite">Заявки</h1>
            <p className="text-sm text-dusk mt-1">Всего: {leads?.length ?? 0}</p>
          </div>
          <span className="text-xs text-dusk bg-sage/10 text-sage px-3 py-1.5 rounded-full font-semibold">BeautyOS Admin</span>
        </div>

        {!leads || leads.length === 0 ? (
          <div className="bg-card border border-parchment rounded-2xl p-12 text-center text-dusk">
            Заявок пока нет
          </div>
        ) : (
          <div className="bg-card border border-parchment rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-parchment bg-cream">
                  <th className="text-left px-5 py-3 text-xs text-dusk font-semibold uppercase tracking-wider">Дата (МСК)</th>
                  <th className="text-left px-5 py-3 text-xs text-dusk font-semibold uppercase tracking-wider">Имя</th>
                  <th className="text-left px-5 py-3 text-xs text-dusk font-semibold uppercase tracking-wider">Контакт</th>
                  <th className="text-left px-5 py-3 text-xs text-dusk font-semibold uppercase tracking-wider">Сообщение</th>
                  <th className="text-left px-5 py-3 text-xs text-dusk font-semibold uppercase tracking-wider">Источник</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: Lead, i: number) => (
                  <tr key={lead.id} className={`border-b border-parchment last:border-0 ${i % 2 === 0 ? '' : 'bg-cream/40'}`}>
                    <td className="px-5 py-4 text-dusk whitespace-nowrap">{formatDate(lead.created_at)}</td>
                    <td className="px-5 py-4 font-semibold text-graphite">{lead.name}</td>
                    <td className="px-5 py-4 text-dusk">
                      {lead.telegram ? (
                        <a href={`https://t.me/${lead.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                          className="text-sage hover:underline">{lead.telegram}</a>
                      ) : lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-dusk max-w-xs">
                      <span className="line-clamp-2">{lead.business_type || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-sage/10 text-sage px-2 py-1 rounded-full">
                        {lead.plan || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
