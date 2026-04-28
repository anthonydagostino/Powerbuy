import { useState } from 'react';
import { login, register } from './services/purchasesApi';

export default function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await login(email, password)
        : await register(email, password);
      onLoginSuccess(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="panel" style={{ width: '100%', maxWidth: 420 }}>
        <h2 style={{ marginBottom: '1.5rem' }}>{mode === 'login' ? 'Log In' : 'Register'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>{error}</p>}
          <button type="submit" disabled={loading} className="primary-button" style={{ marginTop: '0.25rem' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Register'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
