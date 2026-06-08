import Papa from 'papaparse'
import { CSVRow } from '@/types'

// Нормализует заголовки из разных версий YClients / Dikidi / произвольного CSV
const COLUMN_MAP: Record<string, keyof CSVRow> = {
  'клиент': 'client_name',
  'имя клиента': 'client_name',
  'фио': 'client_name',
  'имя': 'client_name',
  'name': 'client_name',
  'client': 'client_name',
  'телефон': 'phone',
  'phone': 'phone',
  'дата': 'visit_date',
  'дата визита': 'visit_date',
  'дата записи': 'visit_date',
  'date': 'visit_date',
  'visit_date': 'visit_date',
  'мастер': 'master_name',
  'специалист': 'master_name',
  'master': 'master_name',
  'услуга': 'service_name',
  'service': 'service_name',
  'сумма': 'amount',
  'стоимость': 'amount',
  'цена': 'amount',
  'amount': 'amount',
  'итого': 'amount',
}

function normalizeHeader(raw: string): keyof CSVRow | null {
  const key = raw.toLowerCase().trim()
  return COLUMN_MAP[key] ?? null
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // DD.MM.YYYY
  const ddmmyyyy = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
  // YYYY-MM-DD — уже нормально
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
  // DD/MM/YYYY
  const slash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`
  return null
}

function parseAmount(raw: string): number {
  if (!raw) return 0
  const clean = raw.replace(/[^\d.,]/g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

export interface ParseResult {
  rows: CSVRow[]
  errors: string[]
  totalRows: number
  skippedRows: number
}

export async function parseYClientsCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const errors: string[] = []
        const rows: CSVRow[] = []
        let skippedRows = 0

        if (!results.data.length) {
          resolve({ rows: [], errors: ['Файл пустой'], totalRows: 0, skippedRows: 0 })
          return
        }

        // Определяем маппинг колонок
        const rawHeaders = Object.keys(results.data[0] as object)
        const colMap: Partial<Record<keyof CSVRow, string>> = {}

        for (const raw of rawHeaders) {
          const normalized = normalizeHeader(raw)
          if (normalized) colMap[normalized] = raw
        }

        if (!colMap.client_name) {
          errors.push('Не найдена колонка с именем клиента. Ожидается: Клиент, Имя, ФИО')
        }
        if (!colMap.visit_date) {
          errors.push('Не найдена колонка с датой визита. Ожидается: Дата, Дата визита')
        }

        if (errors.length > 0) {
          resolve({ rows: [], errors, totalRows: results.data.length, skippedRows: results.data.length })
          return
        }

        for (const [i, rawRow] of (results.data as Record<string, string>[]).entries()) {
          const clientName = colMap.client_name ? rawRow[colMap.client_name]?.trim() : ''
          const visitDateRaw = colMap.visit_date ? rawRow[colMap.visit_date]?.trim() : ''
          const visitDate = parseDate(visitDateRaw)

          if (!clientName || !visitDate) {
            skippedRows++
            continue
          }

          rows.push({
            client_name: clientName,
            phone: colMap.phone ? (rawRow[colMap.phone] || '').replace(/[^\d+]/g, '') : '',
            visit_date: visitDate,
            master_name: colMap.master_name ? (rawRow[colMap.master_name] || '').trim() : '',
            service_name: colMap.service_name ? (rawRow[colMap.service_name] || '').trim() : '',
            amount: colMap.amount ? rawRow[colMap.amount] : '0',
          })
        }

        resolve({ rows, errors, totalRows: results.data.length, skippedRows })
      },
      error: (err) => {
        resolve({ rows: [], errors: [err.message], totalRows: 0, skippedRows: 0 })
      },
    })
  })
}
