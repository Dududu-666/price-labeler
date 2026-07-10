import { useState } from 'react'
import { Modal, Upload, Table, Tag, notification, Alert, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { ProductInsert } from '@/types'
import { parseExcel, getFieldLabel, type ParseResult } from '@/utils/excelParser'
import { Space } from 'antd'

const { Dragger } = Upload

interface ImportExcelModalProps {
  open: boolean
  onClose: () => void
  onImport: (products: ProductInsert[]) => Promise<void>
}

export function ImportExcelModal({ open, onClose, onImport }: ImportExcelModalProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [fileList, setFileList] = useState<any[]>([])

  const handleUpload = async (file: File) => {
    try {
      const result = await parseExcel(file)
      setParseResult(result)
      setFileList([{ uid: '-1', name: file.name, status: 'done' }])

      if (result.errors.length > 0) {
        result.errors.forEach((e) => {
          notification.warning({ message: e.msg })
        })
      } else {
        notification.success({ message: `解析完成，识别到 ${result.products.length} 条商品记录` })
      }
    } catch (e: any) {
      notification.error({ message: '解析失败', description: e?.message })
    }
    return false // Prevent default upload behavior
  }

  const handleImport = async () => {
    if (!parseResult || parseResult.products.length === 0) {
      notification.warning({ message: '没有可导入的数据' })
      return
    }

    try {
      setImporting(true)
      await onImport(parseResult.products)
      notification.success({ message: `成功导入 ${parseResult.products.length} 条商品` })
      handleClose()
    } catch (e: any) {
      notification.error({ message: '导入失败', description: e?.message })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setParseResult(null)
    setFileList([])
    onClose()
  }

  const previewColumns: ColumnsType<Record<string, unknown>> = parseResult
    ? parseResult.headers.map((header, index) => {
        const mapping = parseResult.mappings[index]
        return {
          title: (
            <Space direction="vertical" size={2}>
              <span>{header}</span>
              {mapping.field ? (
                <Tag color="green" style={{ fontSize: 10, margin: 0 }}>
                  → {getFieldLabel(mapping.field)}
                </Tag>
              ) : (
                <Tag color="red" style={{ fontSize: 10, margin: 0 }}>未匹配</Tag>
              )}
            </Space>
          ),
          dataIndex: header,
          key: header,
          ellipsis: true,
          width: 140,
        }
      })
    : []

  const matchedCount = parseResult?.mappings.filter((m) => m.field).length ?? 0
  const totalCount = parseResult?.headers.length ?? 0

  return (
    <Modal
      title="导入 Excel"
      open={open}
      onOk={handleImport}
      onCancel={handleClose}
      confirmLoading={importing}
      width={900}
      okText="确认导入"
      cancelText="取消"
      okButtonProps={{ disabled: !parseResult || parseResult.products.length === 0 }}
    >
      {!parseResult && (
        <div style={{ padding: '16px 0' }}>
          <Dragger
            accept=".xlsx,.xls"
            maxCount={1}
            fileList={fileList}
            beforeUpload={handleUpload}
            onRemove={() => { setParseResult(null); setFileList([]) }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽 Excel 文件到此处上传</p>
            <p className="ant-upload-hint">支持 .xlsx / .xls 格式。系统会自动识别列名（支持中英文）。</p>
            <p className="ant-upload-hint">条码相同的商品将自动更新而不是新增。</p>
          </Dragger>
        </div>
      )}

      {parseResult && (
        <>
          <Alert
            type="info"
            message={`列名匹配：${matchedCount}/${totalCount} 列已匹配`}
            showIcon
            style={{ marginBottom: 16 }}
          />
          {parseResult.errors.length > 0 && (
            <Alert
              type="warning"
              message={`${parseResult.errors.length} 行数据有错误，将被跳过`}
              description={parseResult.errors.slice(0, 5).map((e, i) => <div key={i}>{e.msg}</div>)}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Typography.Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
            预览（共 {parseResult.products.length} 条）：条码相同则更新，条码不存在则新增
          </Typography.Text>
          <Table
            columns={previewColumns}
            dataSource={parseResult.rows.slice(0, 100)}
            rowKey={(_, index) => String(index)}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
          />
          {parseResult.rows.length > 100 && (
            <Typography.Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              预览仅显示前 100 行，共 {parseResult.rows.length} 行
            </Typography.Text>
          )}
        </>
      )}
    </Modal>
  )
}
