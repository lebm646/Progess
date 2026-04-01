import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const BOARD_COLORS = [
  'var(--primary-light)', 'var(--accent-blue)', 'var(--accent-mint)',
  'var(--accent-lavender)', 'var(--accent-peach)'
]

export default function Boards() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchBoards() }, [])

  async function fetchBoards() {
    const { data, error } = await supabase
      .from('boards').select('*').order('created_at', { ascending: false })
    if (!error) setBoards(data)
    setLoading(false)
  }

  async function createBoard(e) {
    e.preventDefault()
    if (!title.trim()) return

    const { data, error } = await supabase
      .from('boards').insert({ title, owner_id: user.id }).select().single()
    if (error) return console.error(error)

    await supabase.from('board_members').insert({ board_id: data.id, user_id: user.id, role: 'owner' })
    await supabase.from('columns').insert([
      { board_id: data.id, title: 'To Do', order: 0 },
      { board_id: data.id, title: 'In Progress', order: 1 },
      { board_id: data.id, title: 'In Review', order: 2 },
      { board_id: data.id, title: 'Done', order: 3 }
    ])

    setTitle('')
    setBoards([data, ...boards])
  }

  async function deleteBoard(e, boardId) {
    e.stopPropagation()
    if (!confirm('Delete this board? This will delete all columns and cards too.')) return
    const { error } = await supabase.from('boards').delete().eq('id', boardId)
    if (!error) setBoards(boards.filter(b => b.id !== boardId))
    else console.error(error.message)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🌸</span>
          <span style={{ fontFamily: 'Lora', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Kanban
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-md)',
            background: 'var(--surface-2)', color: 'var(--text-secondary)',
            fontSize: '13px', fontWeight: '600', border: '1px solid var(--border)'
          }}
          onMouseEnter={e => e.target.style.background = 'var(--border)'}
          onMouseLeave={e => e.target.style.background = 'var(--surface-2)'}
        >
          Log out
        </button>
      </div>

      <div style={{ padding: '2.5rem', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Lora', fontSize: '28px', marginBottom: '0.25rem' }}>My Boards</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '2rem' }}>
          {boards.length} board{boards.length !== 1 ? 's' : ''}
        </p>

        {/* Create board */}
        <form onSubmit={createBoard} style={{
          display: 'flex', gap: '0.75rem', marginBottom: '2rem'
        }}>
          <input
            type="text" placeholder="New board name..."
            value={title} onChange={e => setTitle(e.target.value)}
            style={{
              flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border)', fontSize: '14px',
              background: 'var(--surface)', color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
              background: 'var(--primary)', color: 'white',
              fontSize: '14px', fontWeight: '700',
              boxShadow: '0 4px 12px rgba(249, 168, 188, 0.4)'
            }}
            onMouseEnter={e => e.target.style.background = 'var(--primary-dark)'}
            onMouseLeave={e => e.target.style.background = 'var(--primary)'}
          >
            + Create
          </button>
        </form>

        {/* Board grid */}
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : boards.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
            border: '1.5px dashed var(--border-strong)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🗂️</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>No boards yet — create one above!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            {boards.map((board, i) => (
              <div
                key={board.id}
                onClick={() => navigate(`/boards/${board.id}`)}
                style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                  position: 'relative', transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Color strip */}
                <div style={{
                  height: '8px',
                  background: BOARD_COLORS[i % BOARD_COLORS.length]
                }} />
                <div style={{ padding: '1.25rem' }}>
                  <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                    {board.title}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteBoard(e, board.id)}
                  style={{
                    position: 'absolute', top: '16px', right: '12px',
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', fontSize: '16px',
                    lineHeight: 1, padding: '2px 6px', borderRadius: '6px'
                  }}
                  onMouseEnter={e => { e.target.style.background = '#FFE4E4'; e.target.style.color = '#C62828' }}
                  onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}