import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/boards')
  }

  const inputStyle = {
    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)', fontSize: '14px',
    background: 'var(--surface-2)', color: 'var(--text-primary)'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '1rem'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
        padding: '3rem', width: '100%', maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'var(--accent-lavender)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '28px'
          }}>✨</div>
          <h1 style={{ fontFamily: 'Lora', fontSize: '26px', color: 'var(--text-primary)', marginBottom: '4px' }}>Create account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Start organizing your work</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Full name', value: fullName, setter: setFullName, type: 'text', placeholder: 'Your name' },
            { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'you@example.com' },
            { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
          ].map(({ label, value, setter, type, placeholder }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{label}</label>
              <input
                type={type} value={value} onChange={e => setter(e.target.value)}
                required placeholder={placeholder} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}

          {error && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              background: '#FFF0F0', border: '1px solid #FFCDD2',
              color: '#C62828', fontSize: '13px'
            }}>{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '0.85rem', borderRadius: 'var(--radius-md)',
              background: 'var(--primary)', color: 'white',
              fontSize: '15px', fontWeight: '700',
              boxShadow: '0 4px 12px rgba(249, 168, 188, 0.4)',
              opacity: loading ? 0.7 : 1, marginTop: '0.5rem'
            }}
            onMouseEnter={e => e.target.style.background = 'var(--primary-dark)'}
            onMouseLeave={e => e.target.style.background = 'var(--primary)'}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-dark)', fontWeight: '700', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}