function DashboardCards({
  totalExpectedProfit,
  allTimeProfit,
  currentTotalProfit,
  unpaidCount,
  notDeliveredCount,
  handleResetCurrentProfit,
  lastCashout,
  negativeBalance,
  onNegativeBalanceChange
}) {
  const pendingProfit = totalExpectedProfit - currentTotalProfit;

  return (
    <div className="dashboard-grid">
      <div className="summary-card summary-card--hero">
        <strong>All Time Profit</strong>
        <div className="summary-value">${allTimeProfit.toFixed(2)}</div>
      </div>

      <div className="summary-card">
        <strong>Total Expected Profit</strong>
        <div className="summary-value">${totalExpectedProfit.toFixed(2)}</div>
      </div>

      <div className="summary-card">
        <strong>Current Total Profit</strong>
        <div className="summary-value">${currentTotalProfit.toFixed(2)}</div>
        <button onClick={handleResetCurrentProfit} className="secondary-button">
          Reset
        </button>
      </div>

      <div className="summary-card">
        <strong>Pending Profit</strong>
        <div className="summary-value">${pendingProfit.toFixed(2)}</div>
      </div>

      <div className="summary-card">
        <strong>Last Cashout</strong>
        {lastCashout ? (
          <>
            <div className="summary-value">${lastCashout.amount.toFixed(2)}</div>
            <div className="summary-subtext">{lastCashout.date}</div>
          </>
        ) : (
          <div className="summary-value">—</div>
        )}
      </div>

      <div className="summary-card">
        <strong>Unpaid Count</strong>
        <div className="summary-value">{unpaidCount}</div>
      </div>

      <div className="summary-card">
        <strong>Not Delivered Count</strong>
        <div className="summary-value">{notDeliveredCount}</div>
      </div>

      <div className="summary-card summary-card--wide">
        <strong>Negative Balance</strong>
        <div className="summary-value" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
          <span>$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={negativeBalance}
            onChange={e => onNegativeBalanceChange(e.target.value)}
            className="negative-balance-input"
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardCards;
