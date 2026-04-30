import { useState } from 'react';
import { createPurchase } from '../services/purchasesApi';

const today = new Date().toISOString().split('T')[0];

export default function PurchaseImportDialog({ deals, token, onConfirm, onClose }) {
  const [cashbackRate, setCashbackRate] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      for (const deal of deals) {
        await createPurchase(buildPayload(deal, cashbackRate), token);
      }
      onConfirm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div className="panel" style={{ maxWidth: '740px', width: '100%', marginTop: '20px' }}>
        <h2 style={{ margin: '0 0 4px' }}>Import {deals.length} deal{deals.length !== 1 ? 's' : ''} from Powerbuy</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Cashback rate:</label>
          <select value={cashbackRate} onChange={e => setCashbackRate(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            <option value="5">5%</option>
            <option value="6">6%</option>
            <option value="7">7%</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--table-header, #f1f5f9)' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>UPC</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Sell Total</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Amazon Total</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Est. Profit</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal, i) => {
                const sell = deal.sellPricePerUnit * deal.qty;
                const amazon = deal.totalAmazon;
                const rate = Number(cashbackRate);
                const profit = sell - amazon + amazon * (rate / 100);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border, #e2e8f0)' }}>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 600 }}>{deal.item}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{deal.model}</div>
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>{deal.upc}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{deal.qty}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${sell.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${amazon.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: profit >= 0 ? '#16a34a' : '#dc2626' }}>
                      ${profit.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0.75rem 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="secondary-button" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="primary-button" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Importing...' : `Import ${deals.length} deal${deals.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildPayload(deal, cashbackRate) {
  const rate = Number(cashbackRate);
  const sell = deal.sellPricePerUnit * deal.qty;
  const total = deal.totalAmazon;
  const cashback5 = rate === 5 ? total * 0.05 : 0;
  const cashback6 = rate === 6 ? total * 0.06 : 0;
  const cashback7 = rate === 7 ? total * 0.07 : 0;
  const expires = deal.expires || today;

  return {
    item: deal.item,
    upc: deal.upc,
    model: deal.model,
    totalAmazon: total,
    sellPrice: sell,
    cashback5Percent: cashback5,
    cashback6Percent: cashback6,
    cashback7Percent: cashback7,
    profit5Percent: rate === 5 ? sell - total + cashback5 : 0,
    profit6Percent: rate === 6 ? sell - total + cashback6 : 0,
    profit7Percent: rate === 7 ? sell - total + cashback7 : 0,
    orderPlaced: `${today}T00:00:00Z`,
    quantity: deal.qty,
    expires: `${expires}T00:00:00Z`,
    cardUsed: 'Prime',
    boughtFrom: 'Amazon',
    deliveryStatus: 'Not Delivered',
    paymentStatus: 'Not Paid',
    paymentDate: null,
    trackingNumber: null,
    quantityPaid: 0,
  };
}
