import { useState, useCallback } from 'react'
import { supabase } from '@/supabase/client'
import { PriceChangelog, PriceChangelogInsert } from '@/types'

export function usePriceChangelog() {
  const [changelog, setChangelog] = useState<PriceChangelog[]>([])
  const [loading, setLoading] = useState(false)

  const fetchChangelog = useCallback(async (productId: number) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('price_changelog')
        .select('*')
        .eq('product_id', productId)
        .order('changed_at', { ascending: false })
      if (error) throw error
      setChangelog(data || [])
    } catch (e) {
      console.error('Failed to fetch changelog:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const insertChangelog = useCallback(async (entry: PriceChangelogInsert) => {
    const { error } = await supabase.from('price_changelog').insert(entry)
    if (error) throw error
  }, [])

  return {
    changelog,
    loading,
    fetchChangelog,
    insertChangelog,
  }
}
