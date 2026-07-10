export interface Product {
  id: number
  name: string
  barcode: string
  selling_price: number
  cost_price: number
  category: string
  spec: string
  created_at: string
  updated_at: string
}

export interface ProductInsert {
  name: string
  barcode: string
  selling_price: number
  cost_price: number
  category: string
  spec: string
}

export interface ProductUpdate {
  name?: string
  barcode?: string
  selling_price?: number
  cost_price?: number
  category?: string
  spec?: string
}

export interface Category {
  id: number
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CategoryInsert {
  name: string
  sort_order?: number
}

export interface PriceChangelog {
  id: number
  product_id: number
  old_selling_price: number | null
  new_selling_price: number | null
  old_cost_price: number | null
  new_cost_price: number | null
  changed_by: string
  changed_at: string
}

export interface PriceChangelogInsert {
  product_id: number
  old_selling_price?: number | null
  new_selling_price?: number | null
  old_cost_price?: number | null
  new_cost_price?: number | null
  changed_by: string
}
