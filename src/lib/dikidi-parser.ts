import * as XLSX from 'xlsx'
import { CSVRow } from '@/types'

export interface DikidiParseResult {
  rows: CSVRow[]
  errors: string[]
  totalRows: number
  skippedRows: number
}

function parseBookingCell(cellText: string, master: string, dateStr: string): CSVRow | null {
  const lines = cellText.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return null

  // Извлекаем сумму из первой строки: "11:30 - 12:55    (2800 RUB)"
  const amountMatch = lines[0].match(/\((\d+)\s*RUB\)/)
  const amount = amountMatch ? amountMatch[1] : '0'

  let clientName = ''
  let phone = ''
  const serviceParts: string[] = []

  for (const line of lines.slice(1)) {
    if (/^[78]\d{10}$/.test(line.replace(/\D/g, ''))) {
      const digits = line.replace(/\D/g, '')
      phone = digits.startsWith('8') ? '7' + digits.slice(1) : digits
    } else if (!clientName) {
      clientName = line
    } else if (!/^(долг|потреб|могу|4ног)/i.test(line)) {
      serviceParts.push(line)
    }
  }

  if (!clientName) return null

  // DD.MM.YYYY → YYYY-MM-DD
  const [d, m, y] = dateStr.split('.')
  const visitDate = `${y}-${m}-${d}`

  return {
    client_name: clientName,
    phone,
    visit_date: visitDate,
    master_name: master,
    service_name: serviceParts.join(', '),
    amount,
  }
}

export async function parseDikidiXLS(file: File): Promise<DikidiParseResult> {
  const buffer = await file.arrayBuffer()
  const rows: CSVRow[] = []
  let skippedRows = 0

  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buffer, { type: 'array' })
  } catch {
    return { rows: [], errors: ['Не удалось прочитать файл. Убедитесь, что это файл из Dikidi.'], totalRows: 0, skippedRows: 0 }
  }

  if (!wb.SheetNames.length) {
    return { rows: [], errors: ['Файл не содержит листов'], totalRows: 0, skippedRows: 0 }
  }

  let totalCells = 0

  for (const sheetName of wb.SheetNames) {
    // Название листа = дата в формате DD.MM.YYYY
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(sheetName)) continue

    const ws = wb.Sheets[sheetName]
    const grid: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]

    if (grid.length < 2) continue

    // Строка 0: заголовки — имена мастеров (колонки 1..N)
    const masters = grid[0].slice(1).map(v => String(v).trim()).filter(Boolean)

    for (let r = 1; r < grid.length; r++) {
      for (let ci = 0; ci < masters.length; ci++) {
        const cellVal = String(grid[r][ci + 1] || '').trim()
        if (!cellVal) continue
        totalCells++
        const record = parseBookingCell(cellVal, masters[ci], sheetName)
        if (record) {
          rows.push(record)
        } else {
          skippedRows++
        }
      }
    }
  }

  if (rows.length === 0) {
    return { rows: [], errors: ['В файле не найдено записей клиентов'], totalRows: totalCells, skippedRows }
  }

  return { rows, errors: [], totalRows: totalCells, skippedRows }
}
