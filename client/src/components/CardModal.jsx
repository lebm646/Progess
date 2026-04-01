import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

function getDueDateColor(dueDate) {
  if (!dueDate) return 'var(--text-muted)'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diff = (due - today) / (1000 * 60 * 60 * 24)
  if (diff < 0)  return '#C62828'
  if (diff <= 2) return '#E65100'
  return '#2E7D32'
}

// FIX: extracted from the inline IIFE in JSX — easier to read and test
function getDueDateLabel(dueDate) {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return `⚠️ Overdue by ${Math.abs(diff)} day(s)`
  if (diff === 0) return '⏰ Due today'
  return `✅ Due in ${diff} day(s)`
}

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal__header">
          <h2 className="modal__title">Edit card</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__field">
          <label className="modal__label">Title</label>
          <input
            className="modal__input"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="modal__field">
          <label className="modal__label">Description</label>
          <textarea
            className="modal__input modal__textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="modal__field">
          <label className="modal__label">Due date</label>
          <input
            className="modal__input"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
          {dueDate && (
            <p
              className="modal__due-hint"
              style={{ color: getDueDateColor(dueDate) }}
            >
              {getDueDateLabel(dueDate)}
            </p>
          )}
        </div>

        {boardLabels.length > 0 && (
          <div className="modal__field">
            <label className="modal__label">Labels</label>
            <div className="cm-labels">
              {boardLabels.map(label => {
                const active = cardLabelIds.includes(label.id)
                return (
                  <span
                    key={label.id}
                    className="cm-label"
                    onClick={() => toggleLabel(label.id)}
                    style={{
                      // Label colors are dynamic data — must stay inline
                      background: active ? label.color : label.color + '20',
                      color: active ? '#fff' : label.color,
                      border: `1.5px solid ${label.color}`,
                    }}
                  >
                    {label.name}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div className="modal__footer">
          <button className="modal__btn-danger" onClick={handleDelete}>
            Delete
          </button>
          <div className="modal__footer-actions">
            <button className="modal__btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal__btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}