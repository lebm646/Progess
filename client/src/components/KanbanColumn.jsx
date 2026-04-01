import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import KanbanCard from './KanbanCard'

const COLUMN_COLORS = {
  'To Do': 'var(--accent-blue)',
  'In Progress': 'var(--accent-peach)',
  'In Review': 'var(--accent-lavender)',
  'Done': 'var(--accent-mint)',
}

export default function KanbanColumn({ column, cards, onAddCard, onCardClick, labelRefresh }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const accentColor = COLUMN_COLORS[column.title] || 'var(--primary-light)'

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      width: '300px', minWidth: '300px',
      border: `1.5px solid ${isOver ? 'var(--primary)' : 'var(--border)'}`,
      boxShadow: isOver ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      overflow: 'hidden', transition: 'all 0.2s ease'
    }}>
      {/* Column header */}
      <div style={{
        padding: '1rem 1.25rem 0.75rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: accentColor, border: '2px solid var(--border-strong)'
        }} />
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', flex: 1 }}>
          {column.title}
        </h3>
        <span style={{
          background: 'var(--surface-2)', color: 'var(--text-muted)',
          fontSize: '11px', fontWeight: '700', padding: '2px 8px',
          borderRadius: '99px', border: '1px solid var(--border)'
        }}>
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          style={{
            padding: '0.75rem', minHeight: '80px',
            display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}
        >
          {cards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
              labelRefresh={labelRefresh}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add card button */}
      <div style={{ padding: '0.5rem 0.75rem 0.75rem 1' }}>
        <button
          onClick={() => onAddCard(column.id)}
          style={{
            width: '100%', padding: '0.6rem',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            border: '1.5px dashed var(--border-strong)',
            color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600'
          }}
          onMouseEnter={e => {
            e.target.style.background = 'var(--surface-2)'
            e.target.style.color = 'var(--text-secondary)'
            e.target.style.borderColor = 'var(--primary)'
          }}
          onMouseLeave={e => {
            e.target.style.background = 'transparent'
            e.target.style.color = 'var(--text-muted)'
            e.target.style.borderColor = 'var(--border-strong)'
          }}
        >
          + Add card
        </button>
      </div>
    </div>
  )
}