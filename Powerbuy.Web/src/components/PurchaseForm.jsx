function formatClassName(value) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function PurchaseForm({
  form,
  isEditing,
  loading,
  handleChange,
  handleSubmit,
  resetForm,
  selectedRate,
  sell,
  cashbackAmount,
  profitAmount
}) {
  return (
    <div className="panel">
      <h2>{isEditing ? "Edit Purchase" : "Add Purchase"}</h2>

      <form onSubmit={handleSubmit} className="form-grid">
        <input name="item" placeholder="Item" value={form.item} onChange={handleChange} required />

        <input name="totalAmazon" placeholder="Total Amazon" type="number" step="0.01" value={form.totalAmazon} onChange={handleChange} required />

        <input name="sellPrice" placeholder="Sell Price (per unit)" type="number" step="0.01" value={form.sellPrice} onChange={handleChange} required />

        <div>
          <label>Order Placed</label>
          <input name="orderPlaced" type="date" value={form.orderPlaced} onChange={handleChange} required />
        </div>

        <input name="quantity" placeholder="Quantity" type="number" value={form.quantity} onChange={handleChange} required />

        <div>
          <label>Expires</label>
          <input name="expires" type="date" value={form.expires} onChange={handleChange} required />
        </div>

        <input name="upc" placeholder="UPC" value={form.upc} onChange={handleChange} required />

        <input name="model" placeholder="Model" value={form.model} onChange={handleChange} required />

        <select name="cashbackRate" value={form.cashbackRate} onChange={handleChange} required>
          <option value="5">Cashback Rate: 5%</option>
          <option value="6">Cashback Rate: 6%</option>
          <option value="7">Cashback Rate: 7%</option>
        </select>

        <select
          name="boughtFrom"
          value={form.boughtFrom}
          onChange={handleChange}
          required
          className={`dropdown-${formatClassName(form.boughtFrom)}`}
        >
          <option value="Amazon"  style={{ color: "#ea580c" }}>Amazon</option>
          <option value="Walmart" style={{ color: "#2563eb" }}>Walmart</option>
          <option value="Target"  style={{ color: "#dc2626" }}>Target</option>
          <option value="BestBuy" style={{ color: "#ca8a04" }}>BestBuy</option>
          <option value="Staples" style={{ color: "#7c3aed" }}>Staples</option>
          <option value="Costco"  style={{ color: "#059669" }}>Costco</option>
        </select>

        <select
          name="cardUsed"
          value={form.cardUsed}
          onChange={handleChange}
          required
          className={`dropdown-${formatClassName(form.cardUsed)}`}
        >
          <option value="AMEX Gold"      style={{ color: "#b45309" }}>AMEX Gold</option>
          <option value="Prime"          style={{ color: "#4f46e5" }}>Prime</option>
          <option value="Discover"       style={{ color: "#ea580c" }}>Discover</option>
          <option value="AMEX Platinum"  style={{ color: "#475569" }}>AMEX Platinum</option>
        </select>

        <select name="deliveryStatus" value={form.deliveryStatus} onChange={handleChange} required className={`dropdown-${formatClassName(form.deliveryStatus)}`}>
          <option value="Delivered"     style={{ color: "#16a34a" }}>Delivered</option>
          <option value="Not Delivered" style={{ color: "#dc2626" }}>Not Delivered</option>
          <option value="Refunded"      style={{ color: "#6b7280" }}>Refunded</option>
        </select>

        <select
          name="paymentStatus"
          value={form.paymentStatus}
          onChange={handleChange}
          required
          className={`dropdown-${formatClassName(form.paymentStatus)}`}
        >
          <option value="Paid"      style={{ color: "#16a34a" }}>Paid</option>
          <option value="Not Paid"  style={{ color: "#dc2626" }}>Not Paid</option>
          <option value="Half"      style={{ color: "#d97706" }}>Half</option>
          <option value="Issue"     style={{ color: "#dc2626" }}>Issue</option>
          <option value="Refunded"  style={{ color: "#6b7280" }}>Refunded</option>
        </select>

        <div>
          <label>Payment Date</label>
          <input name="paymentDate" type="date" value={form.paymentDate} onChange={handleChange} />
        </div>

        <input name="trackingNumber" placeholder="Tracking Number" value={form.trackingNumber} onChange={handleChange} />

        <input name="quantityPaid" placeholder="Quantity Paid" type="number" value={form.quantityPaid} onChange={handleChange} required />

        <div className="calculation-box">
          <strong>Selected Calculation</strong>
          <div>Cashback Rate: {selectedRate}%</div>
          <div>Total Sell Price: {sell.toFixed(2)}</div>
          <div>Cashback Amount: {cashbackAmount.toFixed(2)}</div>
          <div>Profit: {profitAmount.toFixed(2)}</div>
        </div>

        <button type="submit" disabled={loading} className="primary-button" style={{ gridColumn: "span 2" }}>
          {loading ? "Saving..." : isEditing ? "Update Purchase" : "Add Purchase"}
        </button>

        {isEditing && (
          <button type="button" onClick={resetForm} className="secondary-button">
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
}

export default PurchaseForm;