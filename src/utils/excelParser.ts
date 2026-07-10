import * as XLSX from 'xlsx'
import { buildColumnMappings, type ColumnMapping, type ProductField } from './columnMatcher'
import type { ProductInsert } from '@/types'

export interface ParseResult {
  headers: string[]
  mappings: ColumnMapping[]
  rows: Record<string, unknown>[]
  products: ProductInsert[]
  errors: { row: number; msg: string }[]
}

const FIELD_NAMES: Record<ProductField, string> = {
  name: '名称',
  barcode: '条码',
  selling_price: '售价',
  cost_price: '进价',
  category: '分类',
  spec: '规格',
}

/**
 * Parse an Excel file and return structured data with column mappings.
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Parse with header row (row 1)
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })

  if (rawRows.length === 0) {
    return { headers: [], mappings: [], rows: [], products: [], errors: [{ row: 0, msg: 'Excel 文件为空' }] }
  }

  const headers = rawRows[0].map((h) => String(h))
  const mappings = buildColumnMappings(headers)

  // Build fieldName → Excel header index mapping
  const fieldToCol: Record<string, number> = {}
  for (const mapping of mappings) {
    if (mapping.field) {
      const idx = mappings.indexOf(mapping)
      fieldToCol[mapping.field] = idx
    }
  }

  const errors: ParseResult['errors'] = []
  const products: ProductInsert[] = []

  // Process data rows (skip header)
  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i]
    if (!row || row.every((cell) => String(cell).trim() === '')) continue

    const getValue = (field: ProductField): string => {
      const idx = fieldToCol[field]
      if (idx === undefined) return ''
      return String(row[idx] ?? '').trim()
    }

    const name = getValue('name')
    const barcode = getValue('barcode')
    const sellingPriceStr = getValue('selling_price')
    const costPriceStr = getValue('cost_price')
    const category = getValue('category')
    const spec = getValue('spec')

    // Validate
    if (!barcode) {
      errors.push({ row: i + 1, msg: `第 ${i + 1} 行缺少条码，已跳过` })
      continue
    }

    const sellingPrice = parseFloat(sellingPriceStr)
    const costPrice = parseFloat(costPriceStr)

    if (sellingPriceStr && isNaN(sellingPrice)) {
      errors.push({ row: i + 1, msg: `第 ${i + 1} 行售价格式错误: "${sellingPriceStr}"` })
    }
    if (costPriceStr && isNaN(costPrice)) {
      errors.push({ row: i + 1, msg: `第 ${i + 1} 行进价格式错误: "${costPriceStr}"` })
    }

    products.push({
      name: name || '',
      barcode,
      selling_price: isNaN(sellingPrice) ? 0 : sellingPrice,
      cost_price: isNaN(costPrice) ? 0 : costPrice,
      category,
      spec,
    })
  }

  return { headers, mappings, rows: rawData, products, errors }
}

/**
 * Get the Chinese display name for a ProductField.
 */
export function getFieldLabel(field: ProductField): string {
  return FIELD_NAMES[field]
}
