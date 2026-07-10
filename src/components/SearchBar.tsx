import { useEffect, useRef } from 'react'
import { Input, Select, Space } from 'antd'
import { SearchOutlined, ScanOutlined } from '@ant-design/icons'
import type { Category } from '@/types'

interface SearchBarProps {
  categories: Category[]
  onBarcodeSearch: (barcode: string) => void
  onNameSearch: (keyword: string) => void
  onCategoryFilter: (category: string | undefined) => void
  nameKeyword: string
  categoryFilter: string | undefined
}

export function SearchBar({
  categories,
  onBarcodeSearch,
  onNameSearch,
  onCategoryFilter,
  nameKeyword,
  categoryFilter,
}: SearchBarProps) {
  const barcodeRef = useRef<any>(null)

  // Auto-focus the scanner input so the clerk can scan immediately
  useEffect(() => {
    barcodeRef.current?.focus()
  }, [])

  // Re-focus after a scan completes
  const handleBarcodeEnter = (value: string) => {
    if (value.trim()) {
      onBarcodeSearch(value.trim())
      // Clear the input after processing
      setTimeout(() => {
        barcodeRef.current?.focus()
      }, 100)
    }
  }

  return (
    <Space wrap style={{ marginBottom: 16, width: '100%' }}>
      <Input
        ref={barcodeRef}
        prefix={<ScanOutlined />}
        placeholder="扫码或输入条码，回车搜索..."
        style={{ width: 280 }}
        onPressEnter={(e) => {
          handleBarcodeEnter((e.target as HTMLInputElement).value)
          // Clear after processing
          setTimeout(() => {
            const input = e.target as HTMLInputElement
            input.value = ''
          }, 100)
        }}
        allowClear
      />
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索商品名称..."
        style={{ width: 220 }}
        value={nameKeyword}
        onChange={(e) => onNameSearch(e.target.value)}
        allowClear
      />
      <Select
        placeholder="按分类筛选"
        style={{ width: 160 }}
        value={categoryFilter}
        onChange={(value) => onCategoryFilter(value)}
        allowClear
      >
        {categories.map((cat) => (
          <Select.Option key={cat.id} value={cat.name}>
            {cat.name}
          </Select.Option>
        ))}
      </Select>
    </Space>
  )
}
