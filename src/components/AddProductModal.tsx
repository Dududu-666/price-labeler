import { useState, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, notification } from 'antd'
import type { ProductInsert, Category } from '@/types'

interface AddProductModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (product: ProductInsert) => Promise<void>
  categories: Category[]
  initialBarcode?: string
}

export function AddProductModal({ open, onClose, onSubmit, categories, initialBarcode }: AddProductModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // Pre-fill barcode if provided (e.g. from scanner)
  useEffect(() => {
    if (open && initialBarcode) {
      form.setFieldsValue({ barcode: initialBarcode })
    }
  }, [open, initialBarcode, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await onSubmit({
        name: values.name,
        barcode: values.barcode,
        selling_price: values.selling_price ?? 0,
        cost_price: values.cost_price ?? 0,
        category: values.category ?? '',
        spec: values.spec ?? '',
      })
      notification.success({ message: '商品添加成功' })
      form.resetFields()
      onClose()
    } catch (e: any) {
      if (e?.errorFields) return // form validation error, don't notify
      notification.error({ message: '添加失败', description: e?.message ?? '请重试' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal title="添加商品" open={open} onOk={handleOk} onCancel={handleCancel} confirmLoading={loading} width={560}>
      <Form form={form} layout="vertical" initialValues={{ barcode: initialBarcode }}>
        <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
          <Input placeholder="例：可口可乐 330ml" />
        </Form.Item>
        <Form.Item name="barcode" label="条码" rules={[{ required: true, message: '请输入条码' }]}>
          <Input placeholder="扫描或输入条码" />
        </Form.Item>
        <Form.Item name="category" label="分类">
          <Select placeholder="选择分类" allowClear>
            {categories.map((cat) => (
              <Select.Option key={cat.id} value={cat.name}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="spec" label="规格">
          <Input placeholder="例：500ml / 12瓶装" />
        </Form.Item>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="selling_price" label="售价 (¥)" style={{ flex: 1 }}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
          </Form.Item>
          <Form.Item name="cost_price" label="进价 (¥)" style={{ flex: 1 }}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
