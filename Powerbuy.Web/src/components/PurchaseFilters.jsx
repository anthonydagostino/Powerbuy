function PurchaseFilters({ setFilter }) {
  return (
    <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <button onClick={() => setFilter("ALL")}>All</button>
      <button onClick={() => setFilter("NOT_PAID")}>Not Paid</button>
      <button onClick={() => setFilter("NOT_DELIVERED")}>Not Delivered</button>
      <button onClick={() => setFilter("EXPIRING_SOON")}>Expiring Soon</button>
      <button onClick={() => setFilter("REFUNDED")}>Refunded</button>
    </div>
  );
}

export default PurchaseFilters;