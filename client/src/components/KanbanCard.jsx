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

  if (diff < 0)  return { bg: '#FFE4E4', color: '#C62828', label: '⚠️ Overdue' }
  if (diff === 0) return { bg: '#FFF8E1', color: '#E65100', label: '⏰ Due today' }
  if (diff <= 2)  return { bg: '#FFF3E0', color: '#F57F17', label: '🔔 Due soon' }
  return           { bg: 'var(--accent-mint)', color: '#1B5E20', label: `📅 ${formatted}` }
}

export default function KanbanCard({ card, onClick, labelRefresh = 0 }) {
  const [labels, setLabels] = useState([])

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging
  } = useSortable({ id: card.id, data: { type: 'card', card } })

  useEffect(() => { fetchLabels() }, [labelRefresh])

  async function fetchLabels() {
    const { data } = await supabase
      .from('card_labels')
      .select('label_id, labels(id, name, color)')
      .eq('card_id', card.id)
    setLabels(data?.map(cl => cl.labels) || [])
  }

  const dueDateStyle = getDueDateStyle(card.due_date)

  return (
    <div
      ref={setNodeRef}
      className={`kanban-card${isDragging ? ' kanban-card--dragging' : ''}`}
      style={{
        // These three must stay inline — they are dynamic values from dnd-kit
        transform: CSS.Transform.toString(transform),
        transition: [transition, 'box-shadow 0.15s ease'].filter(Boolean).join(', '),
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      {labels.length > 0 && (
        <div className="kanban-card__labels">
          {labels.map(label => (
            <span
              key={label.id}
              className="kanban-card__label"
              style={{
                // Label colors are dynamic data — must stay inline
                background: label.color + '30',
                color: label.color,
                border: `1px solid ${label.color}50`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <p className="kanban-card__title">{card.title}</p>

      {dueDateStyle && (
        <div
          className="kanban-card__due"
          style={{
            // Due date colors are dynamic — must stay inline
            background: dueDateStyle.bg,
            color: dueDateStyle.color,
          }}
        >
          {dueDateStyle.label}
        </div>
      )}
    </div>
  )
}