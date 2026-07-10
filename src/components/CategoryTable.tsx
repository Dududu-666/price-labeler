import { useState } from 'react'
import { Table, Button, Space, Popconfirm, notification, Tag } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Category } from '@/types'
import { supabase } from '@/supabase/client'

interface CategoryTableProps {
  categories: Category[]
  loading: boolean
  onRefresh: () => Promise<void>
  onEdit: (category: Category) => void
}

export function CategoryTable({ categories, loading, onRefresh, onEdit }: CategoryTableProps) {
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleDelete = async (category: Category) => {
    try {
      setDeleting(category.id)
      const { error } = await supabase.from('categories').delete().eq('id', category.id)
      if (error) throw error
      notification.success({ message: '分类已删除' })
      await onRefresh()
    } catch (e: any) {
      notification.error({ message: '删除失败', description: e?.message })
    } finally {
      setDeleting(null)
    }
  }

  const columns: ColumnsType<Category> = [
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Category) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定删除分类「${record.name}」吗？已有商品将保留其分类名称但不会再显示在下拉列表中。`}
            onConfirm={() => handleDelete(record)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} loading={deleting === record.id} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={categories}
      rowKey="id"
      loading={loading}
      pagination={false}
      size="middle"
      locale={{ emptyText: '暂无分类' }}
    />
  )
}
