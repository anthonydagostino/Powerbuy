import { useMemo, useState } from 'react';

const DATE_FILTERS = [
  { label: 'All Time', days: null },
  { label: '30 Days', days: 30 },
  { label: '14 Days', days: 14 },
  { label: '7 Days', days: 7 },
  { label: '3 Days', days: 3 },
  { label: '1 Day', days: 1 },
];

const STATUS_COLORS = {
  Paid: '#16a34a',
  Half: '#d97706',
  Issue: '#dc2626',
  Refunded: '#64748b',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatEmailDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function UpcScanHistory({ purchases, isOpen, onClose }) {
  const [activeDays, setActiveDays] = useState(null);

  const scanned = useMemo(() => {
    return purchases
      .filter(p => p.paymentDate != null && p.paymentStatus !== 'Not Paid')
      .filter(p => {
        if (activeDays === null) return true;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - activeDays);
        return new Date(p.paymentDate) >= cutoff;
      })
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  }, [purchases, activeDays]);

  return (
    <>
      {isOpen && <div className="scan-history-overlay" onClick={onClose} />}
      <div className={`scan-history-panel${isOpen ? ' open' : ''}`}>
        <div className="scan-history-header">
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>UPC Scan History</h2>
          <button onClick={onClose} className="scan-history-close">✕</button>
        </div>

        <div className="scan-history-filters">
          {DATE_FILTERS.map(f => (
            <button
              key={f.label}
              className={`filter-button${activeDays === f.days ? ' filter-button-active' : ''}`}
              onClick={() => setActiveDays(f.days)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="scan-history-count">
          {scanned.length} scan{scanned.length !== 1 ? 's' : ''}
        </div>

        <div className="scan-history-list">
          {scanned.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
              No scans found for this period
            </p>
          ) : (
            scanned.map(p => (
              <div key={p.id} className="scan-history-item">
                <div className="scan-history-upc">{p.upc}</div>
                <div className="scan-history-item-name">{p.item}</div>
                <div className="scan-history-meta">
                  <span className="scan-history-date">
                    {p.receiptEmailDate
                      ? `Email: ${formatEmailDate(p.receiptEmailDate)}`
                      : `Processed: ${formatDate(p.paymentDate)}`}
                  </span>
                  <span
                    className="scan-history-status"
                    style={{ color: STATUS_COLORS[p.paymentStatus] ?? '#64748b' }}
                  >
                    {p.paymentStatus}
                  </span>
                </div>
                {p.receiptEmailDate && (
                  <div className="scan-history-processed-date">
                    Processed: {formatDate(p.paymentDate)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
