import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import supabase from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import KanbanColumn from '../components/KanbanColumn'
import KanbanCard from '../components/KanbanCard'
import CardModal from '../components/CardModal'
import LabelManager from '../components/LabelManager'
import AddCardModal from '../components/AddCardModal'

export default function Board() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [board, setBoard] = useState(null)
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [activeCard, setActiveCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [labelRefresh, setLabelRefresh] = useState(0)
  const [addingToColumn, setAddingToColumn] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }
  }))

  useEffect(() => {
    fetchBoard()
  }, [id])

  useEffect(() => {
    const channel = supabase
      .channel('board-' + id)

      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cards',
        filter: `board_id=eq.${id}`
      }, (payload) => {
        setCards(prev => {
          const exists = prev.find(c => c.id === payload.new.id)
          return exists ? prev : [...prev, payload.new]
        })
      })

      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'cards',
        filter: `board_id=eq.${id}`
      }, (payload) => {
        setCards(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
      })

      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'cards',
        filter: `board_id=eq.${id}`
      }, (payload) => {
        setCards(prev => prev.filter(c => c.id !== payload.old.id))
      })

      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'columns',
        filter: `board_id=eq.${id}`
      }, (payload) => {
        setColumns(prev => [...prev, payload.new])
      })

      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'columns',
        filter: `board_id=eq.${id}`
      }, (payload) => {
        setColumns(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
      })

      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'columns',
        filter: `board_id=eq.${id}`
      }, (payload) => {
        setColumns(prev => prev.filter(c => c.id !== payload.old.id))
      })

      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'card_labels'
      }, () => {
        setLabelRefresh(prev => prev + 1)
      })

      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

  async function fetchBoard() {
    try {
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single()

      // FIX: handle board fetch failure — redirect instead of rendering blank
      if (boardError) {
        navigate('/boards')
        return
      }

      const { data: colData } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', id)
        .order('order')

      const { data: cardData } = await supabase
        .from('cards')
        .select('*')
        .eq('board_id', id)
        .order('order')

      setBoard(boardData)
      setColumns(colData || [])
      setCards(cardData || [])
    } catch (err) {
      console.error('fetchBoard crashed:', err.message)
      navigate('/boards')
    } finally {
      setLoading(false)
    }
  }

  function handleCardUpdate(updatedCard) {
    setCards(cards.map(c => c.id === updatedCard.id ? updatedCard : c))
    setLabelRefresh(prev => prev + 1)
  }

  function handleCardDelete(cardId) {
    setCards(cards.filter(c => c.id !== cardId))
  }

  function handleAddCard(columnId) {
    setAddingToColumn(columnId)
  }

  async function handleCreateCard({ title, description, dueDate }) {
    const columnCards = cards.filter(c => c.column_id === addingToColumn)
    const order = columnCards.length

    const { data, error } = await supabase
      .from('cards')
      .insert({
        title,
        description,
        due_date: dueDate || null,
        column_id: addingToColumn,
        board_id: id,
        order
      })
      .select()
      .single()

    if (error) {
      console.error(error.message)
      return
    }

    if (data) {
      setCards(prev => prev.find(c => c.id === data.id) ? prev : [...prev, data])
    }
    setAddingToColumn(null)
  }

  function handleDragStart(event) {
    const { active } = event
    // FIX: renamed from activeCard to draggedCard to avoid shadowing the state variable
    const draggedCard = cards.find(c => c.id === active.id)
    setActiveCard(draggedCard)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    // FIX: renamed to draggedCard to avoid variable shadowing
    const draggedCard = cards.find(c => c.id === active.id)
    if (!draggedCard) return

    const overColumn = columns.find(col => col.id === over.id)
    const overCard = cards.find(c => c.id === over.id)
    const targetColumnId = overColumn ? overColumn.id : overCard?.column_id

    if (!targetColumnId) return

    const isSameColumn = draggedCard.column_id === targetColumnId
    let updatedCards = [...cards]

    if (isSameColumn) {
      const columnCards = updatedCards
        .filter(c => c.column_id === targetColumnId)
        .sort((a, b) => a.order - b.order)

      const oldIndex = columnCards.findIndex(c => c.id === draggedCard.id)
      const newIndex = columnCards.findIndex(c => c.id === over.id)

      if (oldIndex === newIndex) return

      const reordered = arrayMove(columnCards, oldIndex, newIndex)
        .map((c, i) => ({ ...c, order: i }))

      updatedCards = updatedCards.map(c => {
        const updated = reordered.find(r => r.id === c.id)
        return updated || c
      })

      setCards(updatedCards)

      await Promise.all(reordered.map(c =>
        supabase.from('cards').update({ order: c.order }).eq('id', c.id)
      ))
    } else {
      // FIX: re-index target column to prevent order collisions on cross-column move
      const targetCards = updatedCards
        .filter(c => c.column_id === targetColumnId && c.id !== draggedCard.id)
        .sort((a, b) => a.order - b.order)

      const insertAt = overCard
        ? targetCards.findIndex(c => c.id === overCard.id)
        : targetCards.length

      const reindexedTarget = [
        ...targetCards.slice(0, insertAt),
        { ...draggedCard, column_id: targetColumnId, order: insertAt },
        ...targetCards.slice(insertAt)
      ].map((c, i) => ({ ...c, order: i }))

      updatedCards = updatedCards
        .filter(c => c.column_id !== targetColumnId || c.id === draggedCard.id)
        .map(c => c.id === draggedCard.id
          ? reindexedTarget.find(r => r.id === draggedCard.id)
          : c
        )
        .concat(reindexedTarget.filter(c => c.id !== draggedCard.id))

      setCards(updatedCards)

      await Promise.all(reindexedTarget.map(c =>
        supabase.from('cards')
          .update({ column_id: c.column_id, order: c.order })
          .eq('id', c.id)
      ))
    }
  }

  if (loading) return <p className="board-loading">Loading...</p>

  return (
    <div className="board-page">
      <div className="board-header">
        <button className="board-btn-secondary" onClick={() => navigate('/boards')}>
          ← Back
        </button>
        <h1 className="board-title">{board?.title}</h1>
        <button className="board-btn-secondary" onClick={() => setShowLabelManager(true)}>
          Manage labels
        </button>
        {showLabelManager && (
          <LabelManager
            boardId={id}
            onClose={() => setShowLabelManager(false)}
          />
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board-columns">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={cards
                .filter(c => c.column_id === column.id)
                .sort((a, b) => a.order - b.order)}
              onAddCard={handleAddCard}
              onCardClick={(card) => setSelectedCard(card)}
              labelRefresh={labelRefresh}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && <KanbanCard card={activeCard} labelRefresh={labelRefresh} />}
        </DragOverlay>
      </DndContext>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
      {addingToColumn && (
        <AddCardModal
          onClose={() => setAddingToColumn(null)}
          onCreate={handleCreateCard}
        />
      )}
    </div>
  )
}