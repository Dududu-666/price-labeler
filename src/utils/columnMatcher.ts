/**
 * Levenshtein distance for fuzzy string matching.
 */
function levenshtein(a: string, b: string): number {
  const an = a.length
  const bn = b.length
  const matrix: number[][] = []

  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        )
      }
    }
  }

  return matrix[bn][an]
}

export type ProductField = 'name' | 'barcode' | 'selling_price' | 'cost_price' | 'category' | 'spec'

const FIELD_ALIASES: Record<ProductField, string[]> = {
  name: ['名称', '商品名称', '产品名称', '品名', 'name', 'product name', 'product', '商品名', '产品'],
  barcode: ['条码', '条形码', '商品条码', 'SKU', 'sku', 'barcode', 'bar code', '编码', '商品编码', '条码号'],
  selling_price: ['售价', '零售价', '销售价格', '标价', '价格', '单价', 'price', 'selling price', 'sale price', '零售价格', '销售价'],
  cost_price: ['进价', '进货价', '成本', '采购价', 'cost', 'cost price', 'purchase price', '进货价格', '成本价', '采购价格'],
  category: ['分类', '品类', '类别', '商品分类', 'category', 'type', '产品分类', '商品类别'],
  spec: ['规格', '规格型号', '包装规格', '单位', 'spec', 'specification', '型号', '包装', '包装单位'],
}

export interface ColumnMapping {
  field: ProductField | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  originalHeader: string
}

/**
 * Given an Excel header string, find the best matching ProductField.
 * Returns null if no match found with sufficient confidence.
 */
function matchColumn(header: string): { field: ProductField | null; confidence: 'high' | 'medium' | 'low' | 'none' } {
  if (!header || header.trim().length === 0) {
    return { field: null, confidence: 'none' }
  }

  const h = header.trim().toLowerCase()

  // Try exact match first (case-insensitive)
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [ProductField, string[]][]) {
    for (const alias of aliases) {
      if (alias.toLowerCase() === h) {
        return { field, confidence: 'high' }
      }
    }
  }

  // Try substring match (alias is contained in header or vice versa)
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [ProductField, string[]][]) {
    for (const alias of aliases) {
      const al = alias.toLowerCase()
      if (h.includes(al) || al.includes(h)) {
        return { field, confidence: 'high' }
      }
    }
  }

  // Try Levenshtein distance
  let bestField: ProductField | null = null
  let bestDistance = Infinity
  let bestLen = 0

  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [ProductField, string[]][]) {
    for (const alias of aliases) {
      const al = alias.toLowerCase()
      const dist = levenshtein(h, al)
      const maxLen = Math.max(h.length, al.length)
      const normalizedDist = dist / maxLen

      if (normalizedDist < bestDistance / bestLen) {
        bestDistance = dist
        bestLen = maxLen
        bestField = field
      }
    }
  }

  if (bestField && bestLen > 0) {
    const normalizedDist = bestDistance / bestLen
    if (normalizedDist <= 0.2) return { field: bestField, confidence: 'medium' }
    if (normalizedDist <= 0.4) return { field: bestField, confidence: 'low' }
  }

  return { field: null, confidence: 'none' }
}

/**
 * Build column mappings for an array of Excel headers.
 */
export function buildColumnMappings(headers: string[]): ColumnMapping[] {
  return headers.map((header) => {
    const result = matchColumn(header)
    return {
      ...result,
      originalHeader: header,
    }
  })
}

export { FIELD_ALIASES }
