import { useState, useEffect, useCallback, useRef } from 'react'
import { Space, Button, notification, Modal, Tag, Typography, Table, Switch } from 'antd'
import { PlusOutlined, ImportOutlined, ThunderboltOutlined, GroupOutlined } from '@ant-design/icons'
import { SearchBar } from '@/components/SearchBar'
import { ProductTable } from '@/components/ProductTable'
import { AddProductModal } from '@/components/AddProductModal'
import { ImportExcelModal } from '@/components/ImportExcelModal'
import { PriceHistoryDrawer } from '@/components/PriceHistoryDrawer'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { autoCategorize } from '@/utils/autoCategorize'
import type { Product, ProductInsert, ProductUpdate } from '@/types'

// Auto-categorization rules: keyword → category name
// Moved to @/utils/autoCategorize.ts

export function ProductListPage() {
  const {
    products,
    loading: productsLoading,
    total,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    batchUpsert,
    getProductByBarcode,
    fetchUncategorized,
    batchUpdateCategory,
  } = useProducts()

  const { categories, fetchCategories } = useCategories()

  const [nameKeyword, setNameKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [highlightBarcode, setHighlightBarcode] = useState<string | undefined>(undefined)
  const [autoCatModalOpen, setAutoCatModalOpen] = useState(false)
  const [autoCatPreview, setAutoCatPreview] = useState<(Product & { guessedCategory: string })[]>([])
  const [autoCatLoading, setAutoCatLoading] = useState(false)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addBarcode, setAddBarcode] = useState<string | undefined>(undefined)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [groupByCategory, setGroupByCategory] = useState(false)

  // Load products
  useEffect(() => {
    fetchProducts({ nameKeyword: nameKeyword || undefined, category: categoryFilter, page: page - 1, pageSize })
  }, [nameKeyword, categoryFilter, page, pageSize])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Debounced name search
  const handleNameSearch = useCallback((keyword: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setNameKeyword(keyword)
    }, 350)
  }, [])

  // Auto-categorize: analyze all uncategorized products
  const handleAutoCategorize = useCallback(async () => {
    setAutoCatLoading(true)
    const all = await fetchUncategorized()
    const matched = all
      .map(p => ({ ...p, guessedCategory: autoCategorize(p.name) || '' }))
      .filter(p => p.guessedCategory)
    setAutoCatPreview(matched)
    setAutoCatModalOpen(true)
    setAutoCatLoading(false)
  }, [fetchUncategorized])

  const applyAutoCategorize = useCallback(async () => {
    setAutoCatLoading(true)
    await batchUpdateCategory(autoCatPreview.map(item => ({
      id: item.id,
      category: item.guessedCategory,
    })))
    notification.success({ message: `已为 ${autoCatPreview.length} 个商品自动分类` })
    setAutoCatModalOpen(false)
    setAutoCatLoading(false)
    fetchProducts({ nameKeyword: nameKeyword || undefined, category: categoryFilter, pageSize: 50 })
  }, [autoCatPreview, batchUpdateCategory, fetchProducts, nameKeyword, categoryFilter])

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p)
    setPageSize(ps)
  }, [])

  // Barcode scanner
  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    const product = await getProductByBarcode(barcode)
    if (product) {
      setHighlightBarcode(barcode)
      await fetchProducts({ barcode, nameKeyword: undefined, category: undefined })
      notification.success({ message: `找到: ${product.name || product.barcode}`, description: `售价 ¥${product.selling_price.toFixed(2)}` })
    } else {
      setAddBarcode(barcode)
      setAddModalOpen(true)
    }
  }, [getProductByBarcode, fetchProducts])

  const handleCategoryFilter = useCallback((cat: string | undefined) => {
    setCategoryFilter(cat)
    setHighlightBarcode(undefined)
  }, [])

  const handleAddProduct = useCallback(async (product: ProductInsert) => {
    await createProduct(product)
    await fetchProducts({ nameKeyword: nameKeyword || undefined, category: categoryFilter, pageSize: 50 })
  }, [createProduct, fetchProducts, nameKeyword, categoryFilter])

  const handleUpdateProduct = useCallback(async (id: number, data: ProductUpdate) => {
    await updateProduct(id, data)
  }, [updateProduct])

  const handleDeleteProduct = useCallback(async (id: number) => {
    await deleteProduct(id)
    await fetchProducts({ nameKeyword: nameKeyword || undefined, category: categoryFilter, barcode: highlightBarcode, pageSize: 50 })
  }, [deleteProduct, fetchProducts, nameKeyword, categoryFilter, highlightBarcode])

  const handleImport = useCallback(async (products: ProductInsert[]) => {
    await batchUpsert(products)
    await fetchProducts({ nameKeyword: nameKeyword || undefined, category: categoryFilter, pageSize: 50 })
  }, [batchUpsert, fetchProducts, nameKeyword, categoryFilter])

  const clearBarcodeSearch = useCallback(() => {
    setHighlightBarcode(undefined)
    fetchProducts({ nameKeyword: nameKeyword || undefined, category: categoryFilter, pageSize: 50 })
  }, [fetchProducts, nameKeyword, categoryFilter])

  // Auto-categorize preview columns
  const autoCatColumns = [
    { title: '商品名称', dataIndex: 'name', key: 'name', width: 250 },
    { title: '条码', dataIndex: 'barcode', key: 'barcode', width: 160, render: (t: string) => <Typography.Text code style={{ fontSize: 12 }}>{t}</Typography.Text> },
    { title: '猜测分类', dataIndex: 'guessedCategory', key: 'guessedCategory', width: 120, render: (t: string) => <Tag color="green">{t}</Tag> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <SearchBar
          categories={categories}
          onBarcodeSearch={handleBarcodeSearch}
          onNameSearch={handleNameSearch}
          onCategoryFilter={handleCategoryFilter}
          nameKeyword={nameKeyword}
          categoryFilter={categoryFilter}
        />
        <Space>
          {highlightBarcode && (
            <Button onClick={clearBarcodeSearch}>清除条码搜索</Button>
          )}
          <Space size="small">
            <GroupOutlined />
            <Switch
              checked={groupByCategory}
              onChange={setGroupByCategory}
              checkedChildren="分组"
              unCheckedChildren="列表"
            />
          </Space>
          <Button icon={<ThunderboltOutlined />} onClick={handleAutoCategorize} loading={autoCatLoading}>
            自动分类
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
            导入 Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setAddBarcode(undefined); setAddModalOpen(true) }}>
            添加商品
          </Button>
        </Space>
      </div>

      <ProductTable
        products={products}
        loading={productsLoading}
        total={total}
        page={page}
        pageSize={pageSize}
        groupByCategory={groupByCategory}
        onPageChange={handlePageChange}
        onUpdate={handleUpdateProduct}
        onDelete={handleDeleteProduct}
        onShowHistory={setHistoryProduct}
        highlightBarcode={highlightBarcode}
      />

      {/* Auto-categorize preview modal */}
      <Modal
        title="自动分类预览"
        open={autoCatModalOpen}
        onOk={applyAutoCategorize}
        onCancel={() => setAutoCatModalOpen(false)}
        confirmLoading={autoCatLoading}
        okText="确认应用"
        cancelText="取消"
        width={700}
      >
        <Typography.Paragraph type="secondary">
          系统根据商品名称关键词，为以下 <strong>{autoCatPreview.length}</strong> 个未分类商品匹配了分类。确认后自动应用。
        </Typography.Paragraph>
        <Table
          columns={autoCatColumns}
          dataSource={autoCatPreview}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20 }}
          scroll={{ y: 400 }}
        />
      </Modal>

      <AddProductModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddProduct}
        categories={categories}
        initialBarcode={addBarcode}
      />

      <ImportExcelModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
      />

      <PriceHistoryDrawer
        open={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
        productId={historyProduct?.id ?? null}
        productName={historyProduct?.name || historyProduct?.barcode || ''}
      />
    </div>
  )
}
