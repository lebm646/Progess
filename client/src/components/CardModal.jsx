import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export default function CardModal({ card, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.split('T')[0] : '')
  const [saving, setSaving] = useState(false)
  const [boardLabels, setBoardLabels] = useState([])
  const [cardLabelIds, setCardLabelIds] = useState([])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => { fetchLabels() }, [])

  async function fetchLabels() {
    const { data: allLabels } = await supabase.from('labels').select('*').eq('board_id', card.board_id)
    const { data: cardLabels } = await supabase.from('card_labels').select('label_id').eq('card_id', card.id)
    setBoardLabels(allLabels || [])
    setCardLabelIds(cardLabels?.map(cl => cl.label_id) || [])
  }

  async function toggleLabel(labelId) {
    const isAttached = cardLabelIds.includes(labelId)
    if (isAttached) {
      await supabase.from('card_labels').delete().eq('card_id', card.id).eq('label_id', labelId)
      setCardLabelIds(cardLabelIds.filter(id => id !== labelId))
    } else {
      await supabase.from('card_labels').insert({ card_id: card.id, label_id: labelId })
      setCardLabelIds([...cardLabelIds, labelId])
    }
  }

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase
      .from('cards').update({ title, description, due_date: dueDate || null })
      .eq('id', card.id).select().single()
    setSaving(false)
    if (!error) { onUpdate(data); onClose() }
    else console.error(error.message)
  }

  async function handleDelete() {
    if (!confirm('Delete this card?')) return
    const { error } = await supabase.from('cards').delete().eq('id', card.id)
    if (!error) { onDelete(card.id); onClose() }
  }

  function getDueDateColor() {
  if (!dueDate) return 'var(--text-muted)'
  
  const today = new Date()
  today.setHours(0, 0, 0, 0) // strip time

  const due = new Date(dueDate + 'T00:00:00') // parse as local, not UTC
  
  const diff = (due - today) / (1000 * 60 * 60 * 24)
  if (diff < 0) return '#C62828'
  if (diff <= 2) return '#E65100'
  return '#2E7D32'
}

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
          <h2 style={{ fontFamily: 'Lora', fontSize: '20px', color: 'var(--text-primary)' }}>Edit card</h2>
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
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            rows={3} style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Due date */}
        <div>
          <label style={labelStyle}>Due date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {dueDate && (
            <p style={{ fontSize: '12px', color: getDueDateColor(), marginTop: '4px', fontWeight: '600' }}>
              {(() => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const due = new Date(dueDate + 'T00:00:00')
                const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
                if (diff < 0) return `⚠️ Overdue by ${Math.abs(diff)} day(s)`
                if (diff === 0) return '⏰ Due today'
                return `✅ Due in ${diff} day(s)`
              })()}
            </p>
          )}
        </div>

        {/* Labels */}
        {boardLabels.length > 0 && (
          <div>
            <label style={labelStyle}>Labels</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {boardLabels.map(label => {
                const active = cardLabelIds.includes(label.id)
                return (
                  <span
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    style={{
                      padding: '4px 12px', borderRadius: '99px', fontSize: '12px',
                      fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? label.color : label.color + '20',
                      color: active ? '#fff' : label.color,
                      border: `1.5px solid ${label.color}`
                    }}
                  >
                    {label.name}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)',
              background: '#FFF0F0', border: '1px solid #FFCDD2',
              color: '#C62828', fontSize: '13px', fontWeight: '700'
            }}
          >
            Delete
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              onClick={handleSave} disabled={saving}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)',
                background: 'var(--primary)', color: 'white',
                fontSize: '13px', fontWeight: '700',
                boxShadow: '0 4px 12px rgba(249, 168, 188, 0.4)',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}