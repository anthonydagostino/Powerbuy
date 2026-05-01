import { useState, useEffect } from 'react';
import { getGmailAuthUrl, getGmailStatus, syncGmailReceipts, disconnectGmail } from '../services/gmailApi';

const RESULT_COLORS = {
  Paid: '#16a34a',
  Half: '#d97706',
  Issue: '#dc2626',
  'No Match': '#64748b',
};

export default function GmailSync({ token, onProcessed }) {
  const [connected, setConnected] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [scanDays, setScanDays] = useState(3);

  const SCAN_OPTIONS = [
    { label: '1 day', days: 1 },
    { label: '3 days', days: 3 },
    { label: '5 days', days: 5 },
    { label: '7 days', days: 7 },
    { label: '2 weeks', days: 14 },
    { label: '1 month', days: 30 },
  ];

  useEffect(() => {
    // Handle OAuth redirect back from Google
    const params = new URLSearchParams(window.location.search);
    if (params.has('gmailConnected')) {
      setSuccessMsg('Gmail connected!');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.has('gmailError')) {
      setError(`Gmail connection failed: ${params.get('gmailError')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
    checkStatus();
  }, []);

  async function checkStatus() {
    setStatusLoading(true);
    try {
      const data = await getGmailStatus(token);
      setConnected(data.connected);
    } catch {
      // silently fail — status check shouldn't break the page
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleConnect() {
    setError('');
    try {
      const data = await getGmailAuthUrl(token);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError('');
    setResults(null);
    try {
      const data = await syncGmailReceipts(token, scanDays);
      setResults(data);
      if (onProcessed) onProcessed();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectGmail(token);
      setConnected(false);
      setResults(null);
      setSuccessMsg('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (statusLoading) return null;

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Gmail Receipt Sync</h2>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.2rem 0.65rem',
          borderRadius: '999px',
          background: connected ? '#dcfce7' : '#f1f5f9',
          color: connected ? '#166534' : '#64748b',
        }}>
          {connected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      {successMsg && (
        <p style={{ color: '#16a34a', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>{successMsg}</p>
      )}
      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {!connected ? (
          <button className="primary-button" onClick={handleConnect}>
            Connect Gmail
          </button>
        ) : (
          <>
            <select
              value={scanDays}
              onChange={e => setScanDays(Number(e.target.value))}
              disabled={syncing}
              style={{
                fontSize: '0.875rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--input-border)',
                background: 'var(--input-bg)',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {SCAN_OPTIONS.map(opt => (
                <option key={opt.days} value={opt.days}>{opt.label}</option>
              ))}
            </select>
            <button className="primary-button" onClick={handleSync} disabled={syncing}>
              {syncing ? 'Scanning...' : 'Scan Gmail for Receipts'}
            </button>
            <button className="secondary-button" onClick={handleDisconnect}>
              Disconnect
            </button>
          </>
        )}
      </div>

      {results && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            {results.threadsFound === 0
              ? 'No matching receipt emails found in Gmail.'
              : results.threadsProcessed === 0
              ? `Found ${results.threadsFound} email${results.threadsFound !== 1 ? 's' : ''} but couldn't parse any receipts — PDF format may not match.`
              : `Processed ${results.threadsProcessed} of ${results.threadsFound} email thread${results.threadsFound !== 1 ? 's' : ''}`}
          </p>
          {results.results.length > 0 && (
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
          )}
        </div>
      )}
    </div>
  );
}
