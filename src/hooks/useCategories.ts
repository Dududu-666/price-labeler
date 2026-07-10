import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabase/client'
import { Category, CategoryInsert } from '@/types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      setCategories(data || [])
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const createCategory = useCallback(async (data: CategoryInsert) => {
    const { error } = await supabase.from('categories').insert(data)
    if (error) throw error
  }, [])

  const updateCategory = useCallback(async (id: number, data: { name: string; sort_order?: number }) => {
    const { error } = await supabase.from('categories').update(data).eq('id', id)
    if (error) throw error
  }, [])

  const deleteCategory = useCallback(async (id: number) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
