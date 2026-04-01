import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

function getDueDateStyle(dueDate) {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate.slice(0, 10) + 'T00:00:00')
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

  const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (diff < 0) return { bg: '#FFE4E4', color: '#C62828', label: '⚠️ Overdue' }
  if (diff === 0) return { bg: '#FFF8E1', color: '#E65100', label: '⏰ Due today' }
  if (diff <= 2) return { bg: '#FFF3E0', color: '#F57F17', label: '🔔 Due soon' }
  return { bg: 'var(--accent-mint)', color: '#1B5E20', label: `📅 ${formatted}` }
}

export default function KanbanCard({ card, onClick, labelRefresh = 0 }) {
  const [labels, setLabels] = useState([])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id, data: { type: 'card', card }
  })

  useEffect(() => { fetchLabels() }, [labelRefresh])

  async function fetchLabels() {
    const { data } = await supabase
      .from('card_labels').select('label_id, labels(id, name, color)').eq('card_id', card.id)
    setLabels(data?.map(cl => cl.labels) || [])
  }

  const dueDateStyle = getDueDateStyle(card.due_date)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition, opacity: isDragging ? 0.4 : 1,
        background: 'var(--surface)', borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--border)', padding: '0.875rem',
        cursor: 'grab', boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: 'box-shadow 0.15s ease'
      }}
      {...attributes} {...listeners} onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {labels.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {labels.map(label => (
            <span key={label.id} style={{
              background: label.color + '30', color: label.color,
              border: `1px solid ${label.color}50`,
              borderRadius: '99px', padding: '1px 8px',
              fontSize: '11px', fontWeight: '700'
            }}>
              {label.name}
            </span>
          ))}
        </div>
      )}

      <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {card.title}
      </p>

      {dueDateStyle && (
        <div style={{
          marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: dueDateStyle.bg, color: dueDateStyle.color,
          borderRadius: '99px', padding: '2px 8px', fontSize: '11px', fontWeight: '700'
        }}>
          {dueDateStyle.label || new Date(card.due_date).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}