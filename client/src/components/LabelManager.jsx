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

  useEffect(() => {
    fetchLabels()
  }, [])

  async function fetchLabels() {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .eq('board_id', boardId)
    setLabels(data || [])
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    const { data, error } = await supabase
      .from('labels')
      .insert({ board_id: boardId, name, color })
      .select()
      .single()
    if (!error) {
      setLabels([...labels, data])
      setName('')
    }
  }

  async function handleDelete(id) {
    await supabase.from('labels').delete().eq('id', id)
    setLabels(labels.filter(l => l.id !== id))
  }

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
          background: '#fff', borderRadius: '10px',
          padding: '2rem', width: '400px', maxWidth: '90vw'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Manage labels</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Label name..."
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  outline: color === c ? '3px solid #000' : 'none',
                  outlineOffset: '2px'
                }}
              />
            ))}
          </div>
          <button
            type="submit"
            style={{
              padding: '0.5rem', borderRadius: '6px',
              background: '#3b82f6', color: '#fff',
              border: 'none', cursor: 'pointer'
            }}
          >
            Add label
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {labels.map(label => (
            <div key={label.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                background: label.color, color: '#fff',
                padding: '3px 10px', borderRadius: '12px', fontSize: '13px'
              }}>
                {label.name}
              </span>
              <button
                onClick={() => handleDelete(label.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
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