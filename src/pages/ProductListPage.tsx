import { useState, useEffect, useCallback, useRef } from 'react'
import { Space, Button, notification, Modal, Tag, Typography, Table } from 'antd'
import { PlusOutlined, ImportOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { SearchBar } from '@/components/SearchBar'
import { ProductTable } from '@/components/ProductTable'
import { AddProductModal } from '@/components/AddProductModal'
import { ImportExcelModal } from '@/components/ImportExcelModal'
import { PriceHistoryDrawer } from '@/components/PriceHistoryDrawer'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/supabase/client'
import type { Product, ProductInsert, ProductUpdate } from '@/types'

// Auto-categorization rules: keyword → category name
const AUTO_CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  { keywords: ['雪碧', '芬达', '美年达', '可口可乐', '百事可乐', '农夫山泉', '怡宝', '王老吉', '红牛', '脉动', '咖啡', '冰红茶', '绿茶', '奶茶', '气泡', '苏打', '果汁', '椰汁', '豆奶', '牛奶', '酸奶', '乳酸菌', '矿泉水', '纯净水', '蒸馏水', '饮料', '维他', '元气森林', '佳得乐', '尖叫', '雀巢', '纯悦', '依云', '恒大冰泉', '娃哈哈', '魔爪', '东鹏', '战马', '宝矿力'], category: '饮料' },
  { keywords: ['薯片', '奥利奥', '饼干', '仙贝', '派', '蛋糕', '坚果', '果干', '蜜饯', '糖果', '巧克力', '德芙', '费列罗', '士力架', '零食', '瓜子', '花生', '豆干', '肉干', '凤爪', '鸭脖', '周黑鸭', '良品铺子', '三只松鼠', '百草味', '来伊份', '好吃点', '徐福记', '盼盼', '达利园', '好丽友', '旺旺', '趣多多', '闲趣', '比比赞', '锅巴', '虾条', '爆米花', '海苔', '鱿鱼丝', '牛肉干', '猪肉脯', '辣条'], category: '零食' },
  { keywords: ['洗发', '护发', '沐浴', '洗手', '洗衣', '洗洁', '洗面', '牙膏', '牙刷', '毛巾', '纸巾', '卫生纸', '抽纸', '卷纸', '洁柔', '维达', '心相印', '清风', '海飞丝', '潘婷', '清扬', '飘柔', '舒肤佳', '力士', '多芬', '蓝月亮', '立白', '汰渍', '奥妙', '威猛', '妙洁', '狮王', '3M', '妙思乐', '洗碗', '洁厕', '清香', '除菌', '消毒', '湿巾', '尿不湿', '日用', '香皂', '肥皂', '洗衣粉', '洗衣液', '柔顺剂', '漂白', '杀虫', '蚊香', '花露水', '垃圾袋', '保鲜膜', '保鲜袋'], category: '日用品' },
  { keywords: ['啤酒', '白酒', '红酒', '葡萄酒', '黄酒', '洋酒', '鸡尾酒', '锐澳', '江小白', '茅台', '五粮液', '剑南春', '泸州', '洋河', '古井', '张裕', '长城', '王朝', '汾酒', '习酒', '牛栏山', '二锅头', '青岛', '雪花', '百威', '哈尔滨', '燕京', '酒'], category: '酒类' },
  { keywords: ['酱油', '醋', '盐', '味精', '鸡精', '辣椒', '花椒', '八角', '桂皮', '豆瓣', '老干妈', '酱', '油', '料酒', '蚝油', '生抽', '老抽', '调味', '鸡粉', '胡椒粉', '孜然', '咖喱', '番茄酱', '沙司', '沙拉', '麻油', '香油', '海天', '李锦记', '太太乐', '金龙鱼', '鲁花', '福临门', '千禾', '厨邦', '家乐', '味好美', '王守义', '十三香', '恒顺', '六月鲜', '东古', '乌江', '仲景', '饭扫光', '糖', '冰糖', '红糖', '白糖', '淀粉', '酵母', '苏打粉', '泡打粉', '火锅底料', '蘸料', '拌饭酱', '黄豆酱', '甜面酱', '芝麻酱', '花生酱'], category: '调味品' },
  { keywords: ['米', '面', '油', '面粉', '大米', '面条', '方便面', '粉丝', '粉条', '五谷', '杂粮', '鸡蛋', '鸭蛋', '挂面', '馒头', '包子', '饺子', '汤圆', '粽子', '粮油', '小米', '黑米', '糯米', '薏米', '燕麦', '玉米', '红薯', '紫薯', '土豆'], category: '粮油' },
  { keywords: ['雪糕', '冰淇淋', '冰棍', '冷冻', '速冻', '冰激凌', '冰棒', '冻品', '冷藏', '冰棒', '棒冰', '甜筒'], category: '冷冻食品' },
  { keywords: ['烟', '香烟', '中华', '玉溪', '利群', '黄鹤楼', '芙蓉王', '云烟', '红塔山', '万宝路', '南京', '苏烟', '泰山', '娇子', '黄金叶', '双喜', '中南海', '红双喜', '白沙', '真龙'], category: '烟草' },
]

function autoCategorize(name: string): string | null {
  const lower = name.toLowerCase()
  for (const rule of AUTO_CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) return rule.category
    }
  }
  return null
}

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

  // Load products
  useEffect(() => {
    fetchProducts({ nameKeyword: nameKeyword || undefined, category: categoryFilter, pageSize: 50 })
  }, [nameKeyword, categoryFilter])

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
    const { data } = await supabase.from('products').select('*').or('category.is.null,category.eq.""')
    const all = (data || []) as Product[]
    const matched = all
      .map(p => ({ ...p, guessedCategory: autoCategorize(p.name) || '' }))
      .filter(p => p.guessedCategory)
    setAutoCatPreview(matched)
    setAutoCatModalOpen(true)
    setAutoCatLoading(false)
  }, [])

  const applyAutoCategorize = useCallback(async () => {
    setAutoCatLoading(true)
    for (const item of autoCatPreview) {
      await supabase.from('products').update({ category: item.guessedCategory }).eq('id', item.id)
    }
    notification.success({ message: `已为 ${autoCatPreview.length} 个商品自动分类` })
    setAutoCatModalOpen(false)
    setAutoCatLoading(false)
    fetchProducts({ nameKeyword: nameKeyword || undefined, category: categoryFilter, pageSize: 50 })
  }, [autoCatPreview, fetchProducts, nameKeyword, categoryFilter])

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
