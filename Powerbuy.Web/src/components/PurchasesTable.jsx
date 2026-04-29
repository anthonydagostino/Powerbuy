const COLUMNS = [
  { key: "id",             label: "Id" },
  { key: "item",           label: "Item" },
  { key: "upc",            label: "UPC" },
  { key: "model",          label: "Model" },
  { key: "quantity",       label: "Qty" },
  { key: "totalAmazon",    label: "Total Amazon" },
  { key: "sellPrice",      label: "Sell Price" },
  { key: "expires",        label: "Expires" },
  { key: "deliveryStatus", label: "Delivery" },
  { key: "paymentStatus",  label: "Payment" },
];

function SortIndicator({ column, sortColumn, sortDirection }) {
  if (sortColumn !== column) return <span className="sort-indicator sort-inactive">↕</span>;
  return (
    <span className="sort-indicator sort-active">
      {sortDirection === "asc" ? "↑" : "↓"}
    </span>
  );
}

function PurchasesTable({
  filteredPurchases,
  getRowClassName,
  toDateInputValue,
  handleEditClick,
  handleDeleteClick,
  sortColumn,
  sortDirection,
  onSort,
}) {
  return (
    <>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {COLUMNS.map(({ key, label }) => (
                <th
                  key={key}
                  className="sortable-th"
                  onClick={() => onSort(key)}
                >
                  {label}
                  <SortIndicator column={key} sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPurchases.map((purchase) => (
              <tr key={purchase.id} className={getRowClassName(purchase)}>
                <td>{purchase.id}</td>
                <td>{purchase.item}</td>
                <td>{purchase.upc}</td>
                <td>{purchase.model}</td>
                <td>{purchase.quantity}</td>
                <td>{purchase.totalAmazon}</td>
                <td>{purchase.sellPrice}</td>
                <td>{toDateInputValue(purchase.expires)}</td>
                <td>{purchase.deliveryStatus}</td>
                <td>{purchase.paymentStatus}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditClick(purchase)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDeleteClick(purchase.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="color-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#fee2e2" }} />
          Not Paid
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#fef2f2" }} />
          Expiring Soon
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#fef9c3" }} />
          Not Delivered
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#dcfce7" }} />
          Paid / Not Delivered
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#fff7ed" }} />
          Half Paid
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#f8fafc" }} />
          Refunded
        </span>
      </div>
    </>
  );
}

export default PurchasesTable;
