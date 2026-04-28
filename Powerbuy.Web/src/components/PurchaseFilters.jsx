function PurchaseFilters({ setFilter }) {
  return (
    <div className="filters">
      <button className="filter-button" onClick={() => setFilter("ALL")}>All</button>
      <button className="filter-button" onClick={() => setFilter("NOT_PAID")}>Not Paid</button>
      <button className="filter-button" onClick={() => setFilter("NOT_DELIVERED")}>Not Delivered</button>
      <button className="filter-button" onClick={() => setFilter("EXPIRING_SOON")}>Expiring Soon</button>
      <button className="filter-button" onClick={() => setFilter("REFUNDED")}>Refunded</button>
    </div>
  );
}

export default PurchaseFilters;
