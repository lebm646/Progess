import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import KanbanCard from './KanbanCard'

export default function KanbanColumn({ column, cards, onAddCard, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div style={{
      background: '#f0f0f0',
      borderRadius: '8px',
      padding: '1rem',
      width: '280px',
      minWidth: '280px',
      border: isOver ? '2px dashed #666' : '2px solid transparent'
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '15px' }}>{column.title}</h3>

      <SortableContext
        items={cards.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} style={{ minHeight: '50px' }}>
          {cards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
            />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={() => onAddCard(column.id)}
        style={{
          marginTop: '0.5rem',
          width: '100%',
          padding: '0.4rem',
          background: 'transparent',
          border: '1px dashed #aaa',
          borderRadius: '6px',
          cursor: 'pointer',
          color: '#666'
        }}
      >
        + Add card
      </button>
    </div>
  )
}