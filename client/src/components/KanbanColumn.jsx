import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import KanbanCard from './KanbanCard'

const COLUMN_COLORS = {
  'To Do':       'var(--accent-blue)',
  'In Progress': 'var(--accent-peach)',
  'In Review':   'var(--accent-lavender)',
  'Done':        'var(--accent-mint)',
}

export default function KanbanColumn({ column, cards, onAddCard, onCardClick, labelRefresh }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const accentColor = COLUMN_COLORS[column.title] || 'var(--primary-light)'

  return (
    <div className={`k-column${isOver ? ' k-column--over' : ''}`}>

      <div className="k-column__header">
        {/* Accent dot color is dynamic data — stays inline */}
        <div className="k-column__dot" style={{ background: accentColor }} />
        <h3 className="k-column__title">{column.title}</h3>
        <span className="k-column__count">{cards.length}</span>
      </div>

      <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="k-column__cards">
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

      <div className="k-column__footer">
        <button className="k-column__add-btn" onClick={() => onAddCard(column.id)}>
          + Add card
        </button>
      </div>

    </div>
  )
}