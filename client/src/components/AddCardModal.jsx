import { useState } from 'react'

export default function AddCardModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const inputStyle = {
    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)', fontSize: '14px',
    background: 'var(--surface-2)', color: 'var(--text-primary)',
    width: '100%'
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: '700',
    color: 'var(--text-secondary)', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: '6px', display: 'block'
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await onCreate({ title, description, dueDate })
    setSaving(false)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(61, 44, 53, 0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
          padding: '2rem', width: '500px', maxWidth: '90vw',
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: '1.25rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Lora', fontSize: '20px', color: 'var(--text-primary)' }}>New card</h2>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', width: '32px', height: '32px',
              fontSize: '16px', color: 'var(--text-muted)'
            }}
          >✕</button>
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Title</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Card title..."
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description..."
            style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Due date */}
        <div>
          <label style={labelStyle}>Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '700'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)',
              background: 'var(--primary)', color: 'white',
              fontSize: '13px', fontWeight: '700',
              boxShadow: '0 4px 12px rgba(249, 168, 188, 0.4)',
              opacity: (saving || !title.trim()) ? 0.6 : 1
            }}
          >
            {saving ? 'Adding...' : 'Add card'}
          </button>
        </div>
      </div>
    </div>
  )
}