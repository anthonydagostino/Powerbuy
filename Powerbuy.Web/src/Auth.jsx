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
    <div className="panel" style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>{mode === 'login' ? 'Log In' : 'Register'}</h2>
      <form onSubmit={handleSubmit} className="form-grid">
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
        {error && <p style={{ color: 'red', gridColumn: 'span 2' }}>{error}</p>}
        <button type="submit" disabled={loading} className="primary-button" style={{ gridColumn: 'span 2' }}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Register'}
        </button>
        <button
          type="button"
          className="secondary-button"
          style={{ gridColumn: 'span 2' }}
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log In'}
        </button>
      </form>
    </div>
  );
}
