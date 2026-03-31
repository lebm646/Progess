import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Boards() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBoards()
  }, [])

  async function fetchBoards() {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setBoards(data)
    setLoading(false)
  }

  async function createBoard(e) {
    e.preventDefault()
    if (!title.trim()) return

    const { data, error } = await supabase
      .from('boards')
      .insert({ title, owner_id: user.id })
      .select()
      .single()

    if (error) return console.error(error)

    // Add owner as a board member
    await supabase.from('board_members').insert({
      board_id: data.id,
      user_id: user.id,
      role: 'owner'
    })

    // Create default columns
    await supabase.from('columns').insert([
      { board_id: data.id, title: 'To Do', order: 0 },
      { board_id: data.id, title: 'In Progress', order: 1 },
      { board_id: data.id, title: 'Done', order: 2 }
    ])

    setTitle('')
    setBoards([data, ...boards])
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Boards</h1>
        <button onClick={handleLogout}>Log out</button>
      </div>

      <form onSubmit={createBoard} style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="New board name..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit">Create board</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : boards.length === 0 ? (
        <p>No boards yet — create one above.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {boards.map(board => (
            <div
              key={board.id}
              onClick={() => navigate(`/boards/${board.id}`)}
              style={{
                padding: '1.5rem',
                background: '#f4f4f4',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {board.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}