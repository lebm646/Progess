import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

const PRESET_COLORS = [
  '#F9A8BC', // pink
  '#B8D8F8', // blue
  '#B8ECD8', // mint
  '#D4C8F8', // lavender
  '#FDDCC8', // peach
  '#F8E4A8', // butter yellow
  '#C8EDF8', // sky
]

export default function LabelManager({ boardId, onClose }) {
  const [labels, setLabels] = useState([])
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
    fetchLabels()
  }, [boardId])

  async function fetchLabels() {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .eq('board_id', boardId)
    
    console.log('Fetched labels:', data) // ← does the deleted label appear here?
    setLabels(data || [])
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return

    const { data, error } = await supabase
      .from('labels')
      .insert({ board_id: boardId, name, color, user_id: currentUser.id })
      .select()
      .single()

    if (!error) {
      setLabels([...labels, data])
      setName('')
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('labels').delete().eq('id', id)
    if (error) return console.error('Failed to delete label:', error.message)
    setLabels(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="lm-overlay" onClick={onClose}>
    <div className="lm-modal" onClick={e => e.stopPropagation()}>

        <div className="lm-header">
        <h2 className="lm-title">Manage labels</h2>
        <button className="lm-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleCreate} className="lm-form">
        <input
            className="lm-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Label name..."
        />

        <div className="lm-colors">
            {PRESET_COLORS.map(c => (
            <div
                key={c}
                className="lm-color"
                onClick={() => setColor(c)}
                style={{
                background: c,
                outline: color === c ? '3px solid #000' : 'none',
                }}
            />
            ))}
        </div>

        <button type="submit" className="lm-btn">
            Add label
        </button>
        </form>

        <div className="lm-list">
        {labels.map(label => (
            <div key={label.id} className="lm-item">
            <span
                className="lm-label"
                style={{ background: label.color }}
            >
                {label.name}
            </span>

            <button
                className="lm-delete"
                onClick={() => handleDelete(label.id)}
            >
                ✕
            </button>
            </div>
        ))}
        </div>

    </div>
    </div>
  )
}