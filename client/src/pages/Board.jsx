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

      // Column changes
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

      // Card label changes
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

    console.log('board:', boardData, boardError)

    const { data: colData, error: colError } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', id)
      .order('order')

    console.log('columns:', colData, colError)

    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('board_id', id)
      .order('order')

    console.log('cards:', cardData, cardError)

    setBoard(boardData)
    setColumns(colData || [])
    setCards(cardData || [])
  } catch (err) {
    console.error('fetchBoard crashed:', err.message)
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

  async function handleAddCard(columnId) {
    const title = prompt('Card title:')
    if (!title?.trim()) return

    const columnCards = cards.filter(c => c.column_id === columnId)
    const order = columnCards.length

    const { data, error } = await supabase
      .from('cards')
      .insert({ title, column_id: columnId, board_id: id, order })
      .select()
      .single()
  
    console.log('inserted card data:', data)
    console.log('inserted card error:', error)

    if (error) {
      console.error('add card error:', error.message, error.code, error.details)
      return
    }

    if (data) {
      setCards(prev => {
        const exists = prev.find(c => c.id === data.id)
        return exists ? prev : [...prev, data]
      })
    }
  }

  function handleDragStart(event) {
    const { active } = event
    const card = cards.find(c => c.id === active.id)
    setActiveCard(card)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const activeCard = cards.find(c => c.id === active.id)
    if (!activeCard) return

    // Check if dropped over a column or a card
    const overColumn = columns.find(col => col.id === over.id)
    const overCard = cards.find(c => c.id === over.id)
    const targetColumnId = overColumn ? overColumn.id : overCard?.column_id

    if (!targetColumnId) return

    const isSameColumn = activeCard.column_id === targetColumnId
    let updatedCards = [...cards]

    if (isSameColumn) {
      const columnCards = updatedCards
        .filter(c => c.column_id === targetColumnId)
        .sort((a, b) => a.order - b.order)

      const oldIndex = columnCards.findIndex(c => c.id === activeCard.id)
      const newIndex = columnCards.findIndex(c => c.id === over.id)

      if (oldIndex === newIndex) return

      const reordered = arrayMove(columnCards, oldIndex, newIndex)
        .map((c, i) => ({ ...c, order: i }))

      updatedCards = updatedCards.map(c => {
        const updated = reordered.find(r => r.id === c.id)
        return updated || c
      })

      setCards(updatedCards)

      // Persist order
      await Promise.all(reordered.map(c =>
        supabase.from('cards').update({ order: c.order }).eq('id', c.id)
      ))
    } else {
      // Move to new column
      const targetCards = updatedCards
        .filter(c => c.column_id === targetColumnId)
        .sort((a, b) => a.order - b.order)

      const newOrder = overCard
        ? targetCards.findIndex(c => c.id === overCard.id)
        : targetCards.length

      updatedCards = updatedCards.map(c =>
        c.id === activeCard.id
          ? { ...c, column_id: targetColumnId, order: newOrder }
          : c
      )

      setCards(updatedCards)

      await supabase.from('cards')
        .update({ column_id: targetColumnId, order: newOrder })
        .eq('id', activeCard.id)
    }
  }

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/boards')}>← Back</button>
        <h1 style={{ margin: 0 }}>{board?.title}</h1>
        <button onClick={() => setShowLabelManager(true)}>Manage labels</button>
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
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', alignItems: 'flex-start' }}>
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
          {activeCard && <KanbanCard card={activeCard} labelRefresh={labelRefresh}/>}
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
    </div>
  )
}