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

  const fields = [
    { label: 'Full name', value: fullName, setter: setFullName, type: 'text',     placeholder: 'Your name' },
    { label: 'Email',     value: email,    setter: setEmail,    type: 'email',    placeholder: 'you@example.com' },
    { label: 'Password',  value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-icon" style={{ background: 'var(--accent-lavender)' }}>✨</div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start organizing your work</p>
        </div>

        <form className="auth-form" onSubmit={handleRegister}>
          {fields.map(({ label, value, setter, type, placeholder }) => (
            <div key={label} className="auth-field">
              <label className="auth-label">{label}</label>
              <input
                className="auth-input"
                type={type}
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder={placeholder}
                required
              />
            </div>
          ))}

          {error && <div className="auth-error">{error}</div>}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link className="auth-link" to="/login">Sign in</Link>
        </p>

      </div>
    </div>
  )
}