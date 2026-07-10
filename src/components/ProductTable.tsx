import { useState } from 'react'
import { Table, Button, Popconfirm, Space, Typography, Tag, notification } from 'antd'
import { HistoryOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Product, ProductUpdate } from '@/types'
import { InlinePriceEdit } from './InlinePriceEdit'
import { useAuth } from '@/contexts/AuthContext'
import { usePriceChangelog } from '@/hooks/usePriceChangelog'

interface ProductTableProps {
  products: Product[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number, pageSize: number) => void
  onUpdate: (id: number, data: ProductUpdate) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onShowHistory: (product: Product) => void
  highlightBarcode?: string
}

export function ProductTable({
  products,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onUpdate,
  onDelete,
  onShowHistory,
  highlightBarcode,
}: ProductTableProps) {
  const [deleting, setDeleting] = useState<number | null>(null)
  const { user } = useAuth()
  const { insertChangelog } = usePriceChangelog()

  const handlePriceUpdate = async (product: Product, field: 'selling_price' | 'cost_price', newValue: number) => {
    const oldValue = product[field]
    if (oldValue === newValue) return

    try {
      await onUpdate(product.id, { [field]: newValue })

      await insertChangelog({
        product_id: product.id,
        old_selling_price: field === 'selling_price' ? oldValue : null,
        new_selling_price: field === 'selling_price' ? newValue : null,
        old_cost_price: field === 'cost_price' ? oldValue : null,
        new_cost_price: field === 'cost_price' ? newValue : null,
        changed_by: user?.email ?? 'unknown',
      })

      const labelMap = { selling_price: '售价', cost_price: '进价' }
      notification.success({ message: `${labelMap[field]}已更新: ¥${oldValue.toFixed(2)} → ¥${newValue.toFixed(2)}` })
    } catch (e: any) {
      notification.error({ message: '更新失败', description: e?.message })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id)
      await onDelete(id)
      notification.success({ message: '商品已删除' })
    } catch (e: any) {
      notification.error({ message: '删除失败', description: e?.message })
    } finally {
      setDeleting(null)
    }
  }

  const columns: ColumnsType<Product> = [
    {
      title: '条码',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
      render: (text: string) => (
        <Typography.Text code style={{ fontSize: 13 }}>{text}</Typography.Text>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Product) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{text || <Typography.Text type="secondary">未命名</Typography.Text>}</Typography.Text>
          {record.spec && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.spec}</Typography.Text>}
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : <Tag>-</Tag>,
    },
    {
      title: '进价 (¥)',
      dataIndex: 'cost_price',
      key: 'cost_price',
      width: 130,
      render: (value: number, record: Product) => (
        <InlinePriceEdit value={value} onSave={(v) => handlePriceUpdate(record, 'cost_price', v)} />
      ),
    },
    {
      title: '售价 (¥)',
      dataIndex: 'selling_price',
      key: 'selling_price',
      width: 130,
      render: (value: number, record: Product) => (
        <Typography.Text strong style={{ color: '#cf1322' }}>
          <InlinePriceEdit value={value} onSave={(v) => handlePriceUpdate(record, 'selling_price', v)} />
        </Typography.Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: Product) => (
        <Space>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => onShowHistory(record)}>
            历史
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定删除「${record.name || record.barcode}」吗？`}
            onConfirm={() => handleDelete(record.id)}
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
      dataSource={products}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        pageSizeOptions: ['20', '50', '100', '200'],
        showTotal: (t) => `共 ${t} 件商品`,
        onChange: (p, ps) => onPageChange(p, ps),
      }}
      size="middle"
      rowClassName={(record) => record.barcode === highlightBarcode ? 'highlighted-row' : ''}
      locale={{ emptyText: '暂无商品，点击右上角"添加商品"或使用扫码枪录入' }}
    />
  )
}
