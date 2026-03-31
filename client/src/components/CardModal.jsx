import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export default function CardModal({ card, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [dueDate, setDueDate] = useState(
    card.due_date ? card.due_date.split('T')[0] : ''
  )
  const [saving, setSaving] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase
      .from('cards')
      .update({
        title,
        description,
        due_date: dueDate || null
      })
      .eq('id', card.id)
      .select()
      .single()

    setSaving(false)
    if (!error) {
      onUpdate(data)
      onClose()
    } else {
      console.error(error.message)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this card?')) return
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', card.id)

    if (!error) {
      onDelete(card.id)
      onClose()
    }
  }

  function getDueDateColor() {
    if (!dueDate) return '#888'
    const today = new Date()
    const due = new Date(dueDate)
    const diff = (due - today) / (1000 * 60 * 60 * 24)
    if (diff < 0) return '#e74c3c'      // overdue — red
    if (diff <= 2) return '#f39c12'     // due soon — amber
    return '#27ae60'                     // upcoming — green
  }

  // Overlay closes modal when clicking outside
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '2rem',
          width: '480px',
          maxWidth: '90vw',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Edit card</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '13px', color: '#666' }}>Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '13px', color: '#666' }}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '13px', color: '#666' }}>Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
          />
          {dueDate && (
            <span style={{ fontSize: '12px', color: getDueDateColor() }}>
              {(() => {
                const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
                if (diff < 0) return `Overdue by ${Math.abs(diff)} day(s)`
                if (diff === 0) return 'Due today'
                return `Due in ${diff} day(s)`
              })()}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '0.5rem 1rem', borderRadius: '6px',
              background: '#fee', border: '1px solid #fcc',
              color: '#c00', cursor: 'pointer'
            }}
          >
            Delete card
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '0.5rem 1rem', borderRadius: '6px',
                background: '#3b82f6', color: '#fff',
                border: 'none', cursor: 'pointer'
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