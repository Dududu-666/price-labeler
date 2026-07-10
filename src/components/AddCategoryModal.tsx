import { useState } from 'react'
import { Modal, Form, Input, InputNumber, notification } from 'antd'

interface AddCategoryModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; sort_order?: number }) => Promise<void>
  initialValues?: { id: number; name: string; sort_order: number }
}

export function AddCategoryModal({ open, onClose, onSubmit, initialValues }: AddCategoryModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const isEdit = !!initialValues

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await onSubmit(values)
      notification.success({ message: isEdit ? '分类已更新' : '分类已添加' })
      form.resetFields()
      onClose()
    } catch (e: any) {
      if (e?.errorFields) return
      notification.error({ message: '操作失败', description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={isEdit ? '编辑分类' : '添加分类'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
          <Input placeholder="例：饮料" />
        </Form.Item>
        <Form.Item name="sort_order" label="排序" tooltip="数字越小排在越前面">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
