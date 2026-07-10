import { useState, useEffect, useCallback, useRef } from 'react'
import { Space, Button, notification } from 'antd'
import { PlusOutlined, ImportOutlined } from '@ant-design/icons'
import { SearchBar } from '@/components/SearchBar'
import { ProductTable } from '@/components/ProductTable'
import { AddProductModal } from '@/components/AddProductModal'
import { ImportExcelModal } from '@/components/ImportExcelModal'
import { PriceHistoryDrawer } from '@/components/PriceHistoryDrawer'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import type { Product, ProductInsert, ProductUpdate } from '@/types'

export function ProductListPage() {
  const {
    products,
    loading: productsLoading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    batchUpsert,
    getProductByBarcode,
  } = useProducts()

  const { categories, fetchCategories } = useCategories()

  // Search state
  const [nameKeyword, setNameKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [highlightBarcode, setHighlightBarcode] = useState<string | undefined>(undefined)

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addBarcode, setAddBarcode] = useState<string | undefined>(undefined)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)

  // Load products on mount and when filters change
  useEffect(() => {
    fetchProducts({ nameKeyword, category: categoryFilter })
  }, [nameKeyword, categoryFilter, fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Debounced name search — use ref to avoid stale closures
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleNameSearch = useCallback((keyword: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setNameKeyword(keyword)
    }, 300)
  }, [])

  // Barcode scanner: exact search, then highlight or open add modal
  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    const product = await getProductByBarcode(barcode)
    if (product) {
      // Show just this product in the table
      setHighlightBarcode(barcode)
      await fetchProducts({ barcode, nameKeyword: undefined, category: undefined })
      notification.success({ message: `找到: ${product.name || product.barcode}`, description: `售价 ¥${product.selling_price.toFixed(2)}` })
    } else {
      // Not found — offer to add
      setAddBarcode(barcode)
      setAddModalOpen(true)
    }
  }, [getProductByBarcode, fetchProducts])

  const handleCategoryFilter = useCallback((cat: string | undefined) => {
    setCategoryFilter(cat)
    setHighlightBarcode(undefined) // Clear barcode highlight when filtering by category
  }, [])

  const handleAddProduct = useCallback(async (product: ProductInsert) => {
    await createProduct(product)
    await fetchProducts({ nameKeyword, category: categoryFilter })
  }, [createProduct, fetchProducts, nameKeyword, categoryFilter])

  const handleUpdateProduct = useCallback(async (id: number, data: ProductUpdate) => {
    await updateProduct(id, data)
    await fetchProducts({ nameKeyword, category: categoryFilter, barcode: highlightBarcode })
  }, [updateProduct, fetchProducts, nameKeyword, categoryFilter, highlightBarcode])

  const handleDeleteProduct = useCallback(async (id: number) => {
    await deleteProduct(id)
    await fetchProducts({ nameKeyword, category: categoryFilter, barcode: highlightBarcode })
  }, [deleteProduct, fetchProducts, nameKeyword, categoryFilter, highlightBarcode])

  const handleImport = useCallback(async (products: ProductInsert[]) => {
    await batchUpsert(products)
    await fetchProducts({ nameKeyword, category: categoryFilter })
  }, [batchUpsert, fetchProducts, nameKeyword, categoryFilter])

  // Clear barcode highlight
  const clearBarcodeSearch = useCallback(() => {
    setHighlightBarcode(undefined)
    fetchProducts({ nameKeyword, category: categoryFilter })
  }, [fetchProducts, nameKeyword, categoryFilter])

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
        onUpdate={handleUpdateProduct}
        onDelete={handleDeleteProduct}
        onShowHistory={setHistoryProduct}
        highlightBarcode={highlightBarcode}
      />

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
