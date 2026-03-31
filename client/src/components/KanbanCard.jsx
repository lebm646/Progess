import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export default function KanbanCard({ card, onClick, labelRefresh = 0 }) {
  const [labels, setLabels] = useState([])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card }
  })

  useEffect(() => {
    fetchLabels()
  }, [labelRefresh])

  async function fetchLabels() {
    const { data } = await supabase
      .from('card_labels')
      .select('label_id, labels(id, name, color)')
      .eq('card_id', card.id)
    setLabels(data?.map(cl => cl.labels) || [])
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '0.75rem',
    cursor: 'grab',
    marginBottom: '0.5rem',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
      {labels.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
          {labels.map(label => (
            <span
              key={label.id}
              style={{
                background: label.color,
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '11px',
                color: '#fff'
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <p style={{ margin: 0, fontWeight: 500 }}>{card.title}</p>
      {card.due_date && (
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
          Due: {new Date(card.due_date).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}