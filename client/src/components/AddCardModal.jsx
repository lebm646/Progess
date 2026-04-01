import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export default function AddCardModal({ onClose, onCreate, boardId }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [boardLabels, setBoardLabels] = useState([])
  const [cardLabelIds, setCardLabelIds] = useState([])

  useEffect(() => { fetchLabels() }, [])
  console.log(boardId)
  console.log(boardLabels)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await onCreate({ title, description, dueDate, labelIds: cardLabelIds })
    setSaving(false)
  }

  async function fetchLabels() {
    const { data: allLabels } = await supabase.from('labels').select('*').eq('board_id', boardId)
    setBoardLabels(allLabels || [])
  }

  function toggleLabel(labelId) {
    if (cardLabelIds.includes(labelId)) {
      setCardLabelIds(cardLabelIds.filter(id => id !== labelId))
    } else {
      setCardLabelIds([...cardLabelIds, labelId])
    }
  }

  const isDisabled = saving || !title.trim()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal__header">
          <h2 className="modal__title">New card</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__field">
          <label className="modal__label">Title</label>
          <input
            className="modal__input"
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Card title..."
          />
        </div>

        <div className="modal__field">
          <label className="modal__label">Description</label>
          <textarea
            className="modal__input modal__textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description..."
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

        <div className="modal__footer modal__footer--end">
          <button className="modal__btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal__btn-primary"
            onClick={handleSave}
            disabled={isDisabled}
            style={{ opacity: isDisabled ? 0.6 : 1 }}
          >
            {saving ? 'Adding...' : 'Add card'}
          </button>
        </div>

      </div>
    </div>
  )
}