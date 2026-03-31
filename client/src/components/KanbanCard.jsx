import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function KanbanCard({ card, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card }
  })

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
      <p style={{ margin: 0, fontWeight: 500 }}>{card.title}</p>
      {card.due_date && (
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
          Due: {new Date(card.due_date).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}