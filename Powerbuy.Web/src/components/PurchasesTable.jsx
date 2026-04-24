function PurchasesTable({
  filteredPurchases,
  getRowClassName,
  toDateInputValue,
  handleEditClick,
  handleDeleteClick
}) {
  return (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={cellStyle}>Id</th>
            <th style={cellStyle}>Item</th>
            <th style={cellStyle}>UPC</th>
            <th style={cellStyle}>Model</th>
            <th style={cellStyle}>Quantity</th>
            <th style={cellStyle}>Total Amazon</th>
            <th style={cellStyle}>Sell Price</th>
            <th style={cellStyle}>Expires</th>
            <th style={cellStyle}>Delivery</th>
            <th style={cellStyle}>Payment</th>
            <th style={cellStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredPurchases.map((purchase) => (
            <tr key={purchase.id} className={getRowClassName(purchase)}>
              <td style={cellStyle}>{purchase.id}</td>
              <td style={cellStyle}>{purchase.item}</td>
              <td style={cellStyle}>{purchase.upc}</td>
              <td style={cellStyle}>{purchase.model}</td>
              <td style={cellStyle}>{purchase.quantity}</td>
              <td style={cellStyle}>{purchase.totalAmazon}</td>
              <td style={cellStyle}>{purchase.sellPrice}</td>
              <td style={cellStyle}>{toDateInputValue(purchase.expires)}</td>
              <td style={cellStyle}>{purchase.deliveryStatus}</td>
              <td style={cellStyle}>{purchase.paymentStatus}</td>
              <td style={cellStyle}>
                <button onClick={() => handleEditClick(purchase)} style={{ marginRight: "0.5rem" }}>
                  Edit
                </button>
                <button onClick={() => handleDeleteClick(purchase.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
        <strong>Row Colors:</strong>
        <div>Red = expiring soon and not delivered</div>
        <div>Light red = not paid</div>
        <div>Yellow = not delivered</div>
        <div>Gray = refunded</div>
      </div>
    </>
  );
}

const cellStyle = {
  border: "1px solid #ccc",
  padding: "0.5rem",
  textAlign: "left"
};

export default PurchasesTable;