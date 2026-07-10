import { useState, useCallback } from 'react'
import { supabase } from '@/supabase/client'
import { Product, ProductInsert, ProductUpdate } from '@/types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchProducts = useCallback(async (params?: {
    barcode?: string
    nameKeyword?: string
    category?: string
    page?: number
    pageSize?: number
  }) => {
    setLoading(true)
    try {
      const page = params?.page ?? 0
      const pageSize = params?.pageSize ?? 50

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })

      if (params?.barcode) {
        query = query.eq('barcode', params.barcode)
      }
      if (params?.nameKeyword) {
        query = query.ilike('name', `%${params.nameKeyword}%`)
      }
      if (params?.category) {
        query = query.eq('category', params.category)
      }

      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) throw error
      setProducts(data || [])
      setTotal(count ?? 0)
    } catch (e) {
      console.error('Failed to fetch products:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const createProduct = useCallback(async (data: ProductInsert) => {
    const { error } = await supabase.from('products').insert(data)
    if (error) throw error
  }, [])

  const updateProduct = useCallback(async (id: number, data: ProductUpdate) => {
    const { error } = await supabase.from('products').update(data).eq('id', id)
    if (error) throw error
  }, [])

  const deleteProduct = useCallback(async (id: number) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  }, [])

  const batchUpsert = useCallback(async (products: ProductInsert[]) => {
    const { error } = await supabase.from('products').upsert(products, {
      onConflict: 'barcode',
    })
    if (error) throw error
  }, [])

  const getProductByBarcode = useCallback(async (barcode: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single()
    if (error) return null
    return data
  }, [])

  /**
   * Fetch all products that have no category set.
   */
  const fetchUncategorized = useCallback(async (): Promise<Product[]> => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .or('category.is.null,category.eq.""')
    return (data || []) as Product[]
  }, [])

  /**
   * Batch-update categories for multiple products by their IDs.
   */
  const batchUpdateCategory = useCallback(async (updates: { id: number; category: string }[]) => {
    for (const { id, category } of updates) {
      await supabase.from('products').update({ category }).eq('id', id)
    }
  }, [])

  /**
   * Update category name on all products matching old name.
   */
  const cascadeCategoryRename = useCallback(async (oldName: string, newName: string) => {
    const { error } = await supabase
      .from('products')
      .update({ category: newName })
      .eq('category', oldName)
    if (error) throw error
  }, [])

  return {
    products,
    loading,
    total,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    batchUpsert,
    getProductByBarcode,
    fetchUncategorized,
    batchUpdateCategory,
    cascadeCategoryRename,
  }
}
