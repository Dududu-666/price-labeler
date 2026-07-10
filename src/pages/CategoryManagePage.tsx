import { useState, useCallback } from 'react'
import { Button, Typography, notification } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { CategoryTable } from '@/components/CategoryTable'
import { AddCategoryModal } from '@/components/AddCategoryModal'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/supabase/client'
import type { Category } from '@/types'

export function CategoryManagePage() {
  const { categories, loading, fetchCategories, createCategory, updateCategory } = useCategories()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category)
    setModalOpen(true)
  }, [])

  const handleAdd = useCallback(() => {
    setEditingCategory(undefined)
    setModalOpen(true)
  }, [])

  const handleSubmit = useCallback(async (data: { name: string; sort_order?: number }) => {
    if (editingCategory) {
      // Update category name — also cascade to products table
      const oldName = editingCategory.name
      await updateCategory(editingCategory.id, data)
      if (data.name !== oldName) {
        // Cascade rename in products
        const { error } = await supabase
          .from('products')
          .update({ category: data.name })
          .eq('category', oldName)
        if (error) {
          notification.warning({ message: '分类名已更新，但部分商品更新失败', description: error.message })
        }
      }
    } else {
      await createCategory(data)
    }
    await fetchCategories()
  }, [editingCategory, updateCategory, createCategory, fetchCategories])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>分类管理</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加分类
        </Button>
      </div>

      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        分类用于给商品归类。修改分类名称会自动更新所有使用该分类的商品。删除分类不会删除其商品。
      </Typography.Text>

      <CategoryTable
        categories={categories}
        loading={loading}
        onRefresh={fetchCategories}
        onEdit={handleEdit}
      />

      <AddCategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editingCategory ? { id: editingCategory.id, name: editingCategory.name, sort_order: editingCategory.sort_order } : undefined}
      />
    </div>
  )
}
