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
    <div className="boards-page">

      <header className="boards-header">
        <div className="boards-logo">
          <span className="boards-logo-icon">🌸</span>
          <span className="boards-logo-text">Progress</span>
        </div>
        <button className="boards-btn-logout" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <div className="boards-content">
        <h2 className="boards-heading">Boards</h2>
        <p className="boards-subheading">
          {boards.length} board{boards.length !== 1 ? 's' : ''}
        </p>

        <form className="boards-create-form" onSubmit={createBoard}>
          <input
            className="boards-create-input"
            type="text"
            placeholder="New board name..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <button className="boards-create-btn" type="submit">
            + Create
          </button>
        </form>

        {loading ? (
          <p className="boards-status-text">Loading...</p>
        ) : boards.length === 0 ? (
          <div className="boards-empty">
            <div className="boards-empty-icon">🗂️</div>
            <p className="boards-empty-text">No boards yet — create one above!</p>
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map((board, i) => (
              <div
                key={board.id}
                className="board-card"
                onClick={() => navigate(`/boards/${board.id}`)}
              >
                <div
                  className="board-card-strip"
                  style={{ background: BOARD_COLORS[i % BOARD_COLORS.length] }}
                />
                <div className="board-card-body">
                  <p className="board-card-title">{board.title}</p>
                </div>
                <button
                  className="board-card-delete"
                  onClick={(e) => deleteBoard(e, board.id)}
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