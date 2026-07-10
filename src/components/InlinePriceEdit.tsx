import { useRef, useState, useEffect } from 'react'
import { InputNumber } from 'antd'

interface InlinePriceEditProps {
  value: number
  onSave: (newValue: number) => void
  precision?: number
}

export function InlinePriceEdit({ value, onSave, precision = 2 }: InlinePriceEditProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [editing])

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <InputNumber
        ref={inputRef as any}
        value={editValue}
        onChange={(v) => setEditValue(v ?? 0)}
        onPressEnter={handleSave}
        onBlur={handleSave}
        precision={precision}
        min={0}
        step={0.01}
        style={{ width: 100 }}
        size="small"
      />
    )
  }

  return (
    <span
      onClick={() => { setEditValue(value); setEditing(true) }}
      style={{ cursor: 'pointer', borderBottom: '1px dashed #d9d9d9', paddingBottom: 2 }}
    >
      {value.toFixed(precision)}
    </span>
  )
}
