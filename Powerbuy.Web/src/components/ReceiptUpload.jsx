import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RESULT_COLORS = {
  Paid: '#16a34a',
  Half: '#d97706',
  Issue: '#dc2626',
  'No Match': '#64748b',
};

export default function ReceiptUpload({ token, onProcessed }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [debugText, setDebugText] = useState('');

  async function handleDebug() {
    if (!file) return;
    setDebugText('');
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE_URL}/api/receipts/debug-pdf-text`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setDebugText(data.text ?? JSON.stringify(data));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE_URL}/api/receipts/upload-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `Error ${res.status}`);

      const data = JSON.parse(text);
      setResults(data);
      if (onProcessed) onProcessed();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Process Receipt PDF</h2>
      <form onSubmit={handleUpload} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="file"
          accept=".pdf"
          onChange={e => { setFile(e.target.files[0]); setResults(null); setError(''); }}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={loading || !file} className="primary-button">
          {loading ? 'Processing...' : 'Process PDF'}
        </button>
        <button type="button" disabled={!file} className="secondary-button" onClick={handleDebug}>
          Debug PDF Text
        </button>
      </form>

      {error && (
        <p style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.875rem' }}>{error}</p>
      )}

      {debugText && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: '0 0 0.5rem' }}>Raw extracted text:</p>
          <pre style={{ background: 'var(--panel-bg, #f8fafc)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '300px', overflowY: 'auto' }}>
            {debugText}
          </pre>
        </div>
      )}

      {results && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            Parsed {results.itemsParsed} item{results.itemsParsed !== 1 ? 's' : ''}
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 2 }}>
            {results.results.map((r, i) => (
              <li key={i}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--muted)' }}>
                  UPC {r.upc}
                </span>
                {' — '}
                <strong style={{ color: RESULT_COLORS[r.result] ?? '#64748b' }}>{r.result}</strong>
                {r.result === 'Half' && ` (qty paid: ${r.quantityPaid})`}
                {r.result === 'Issue' && ` (expected $${r.expectedSellPrice?.toFixed(2)}, got $${r.amountPaid?.toFixed(2)})`}
                {r.result === 'No Match' && ' — not found in your purchases'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
