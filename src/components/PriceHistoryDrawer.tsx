import { useEffect } from 'react'
import { Drawer, Table, Typography, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { PriceChangelog } from '@/types'
import { usePriceChangelog } from '@/hooks/usePriceChangelog'

interface PriceHistoryDrawerProps {
  open: boolean
  onClose: () => void
  productId: number | null
  productName: string
}

export function PriceHistoryDrawer({ open, onClose, productId, productName }: PriceHistoryDrawerProps) {
  const { changelog, loading, fetchChangelog } = usePriceChangelog()

  useEffect(() => {
    if (open && productId) {
      fetchChangelog(productId)
    }
  }, [open, productId, fetchChangelog])

  const columns: ColumnsType<PriceChangelog> = [
    {
      title: '时间',
      dataIndex: 'changed_at',
      key: 'changed_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '售价变更',
      key: 'selling',
      width: 200,
      render: (_: unknown, record: PriceChangelog) => {
        if (record.old_selling_price == null && record.new_selling_price == null) return '-'
        return (
          <span>
            {record.old_selling_price != null && <span style={{ textDecoration: 'line-through', color: '#999' }}>¥{record.old_selling_price.toFixed(2)}</span>}
            {record.old_selling_price != null && record.new_selling_price != null && ' → '}
            {record.new_selling_price != null && <strong style={{ color: '#cf1322' }}>¥{record.new_selling_price.toFixed(2)}</strong>}
          </span>
        )
      },
    },
    {
      title: '进价变更',
      key: 'cost',
      width: 200,
      render: (_: unknown, record: PriceChangelog) => {
        if (record.old_cost_price == null && record.new_cost_price == null) return '-'
        return (
          <span>
            {record.old_cost_price != null && <span style={{ textDecoration: 'line-through', color: '#999' }}>¥{record.old_cost_price.toFixed(2)}</span>}
            {record.old_cost_price != null && record.new_cost_price != null && ' → '}
            {record.new_cost_price != null && <strong style={{ color: '#1677ff' }}>¥{record.new_cost_price.toFixed(2)}</strong>}
          </span>
        )
      },
    },
    {
      title: '操作人',
      dataIndex: 'changed_by',
      key: 'changed_by',
      width: 180,
    },
  ]

  return (
    <Drawer
      title={`「${productName}」价格变更历史`}
      open={open}
      onClose={onClose}
      width={640}
    >
      <Table
        columns={columns}
        dataSource={changelog}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="small"
        locale={{ emptyText: '暂无变更记录' }}
      />
    </Drawer>
  )
}
