import "./App.css";
import { useEffect, useMemo, useState } from "react";
import DashboardCards from "./components/DashboardCards";
import PurchaseFilters from "./components/PurchaseFilters";
import PurchaseForm from "./components/PurchaseForm";
import PurchasesTable from "./components/PurchasesTable";
import Auth from "./Auth";
import GmailSync from "./components/GmailSync";
import ReceiptUpload from "./components/ReceiptUpload";
import {
  CURRENT_PROFIT_BASELINE_KEY,
  emptyForm,
  today
} from "./constants";
import {
  createPurchase,
  deletePurchase,
  getPurchases,
  updatePurchase
} from "./services/purchasesApi";
import {
  buildPurchasePayload,
  getCashbackRateFromPurchase,
  getRowClassName,
  getStoredProfit,
  isExpiringSoon,
  toDateInputValue
} from "./utils/purchaseUtils";

function App() {
  // --- NEW AUTHENTICATION STATE ---
  const [token, setToken] = useState(localStorage.getItem('powerbuy_token') || '');

  // --- EXISTING STATE ---
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [darkMode, setDarkMode] = useState(false);
  const [currentProfitBaseline, setCurrentProfitBaseline] = useState(() => {
    const saved = localStorage.getItem(CURRENT_PROFIT_BASELINE_KEY);
    return saved ? Number(saved) : 0;
  });

  // --- NEW AUTHENTICATION HANDLERS ---
  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    localStorage.setItem('powerbuy_token', newToken);
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('powerbuy_token');
    setPurchases([]); // Clear purchases on logout
  };

  // --- UPDATED API CALLS (Now passing the token!) ---
  async function loadPurchases() {
    if (!token) return; // Don't try to load if not logged in
    try {
      setError("");
      const data = await getPurchases(token); // Pass token
      setPurchases(data);
    } catch (err) {
      setError(err.message);
      // If the token is invalid (e.g. 401), force a logout
      if (err.message.includes("401")) handleLogout(); 
    }
  }

  // Reload purchases whenever the token changes (like after login)
  useEffect(() => {
    loadPurchases();
  }, [token]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  // --- FORM HANDLERS (UNCHANGED) ---
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      orderPlaced: today
    });
    setIsEditing(false);
    setError("");
  }

  function handleEditClick(purchase) {
    const quantity = Number(purchase.quantity) || 0;
    const totalSellPrice = Number(purchase.sellPrice) || 0;
    const sellPricePerUnit = quantity > 0 ? totalSellPrice / quantity : 0;
    setForm({
      id: purchase.id,
      item: purchase.item ?? "",
      totalAmazon: purchase.totalAmazon ?? "",
      sellPrice: sellPricePerUnit ? sellPricePerUnit.toFixed(2) : "",
      cashbackRate: getCashbackRateFromPurchase(purchase),
      orderPlaced: toDateInputValue(purchase.orderPlaced),
      quantity: purchase.quantity ?? "",
      expires: toDateInputValue(purchase.expires),
      upc: purchase.upc ?? "",
      model: purchase.model ?? "",
      cardUsed: purchase.cardUsed ?? "Prime",
      boughtFrom: purchase.boughtFrom ?? "Amazon",
      deliveryStatus: purchase.deliveryStatus ?? "Not Delivered",
      paymentStatus: purchase.paymentStatus ?? "Not Paid",
      paymentDate: toDateInputValue(purchase.paymentDate),
      trackingNumber: purchase.trackingNumber ?? "",
      quantityPaid: purchase.quantityPaid ?? 0
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteClick(id) {
    const confirmed = window.confirm("Delete this purchase?");
    if (!confirmed) return;
    try {
      setError("");
      await deletePurchase(id, token); // Pass token
      if (isEditing && form.id === id) {
        resetForm();
      }
      await loadPurchases();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = buildPurchasePayload(form);
    try {
      setLoading(true);
      setError("");
      if (isEditing) {
        await updatePurchase(form.id, { ...payload, id: form.id }, token);
      } else {
        await createPurchase(payload, token); // Pass token
      }
      resetForm();
      await loadPurchases();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- FILTER & MATH LOGIC (UNCHANGED) ---
  const filteredPurchases = purchases.filter((purchase) => {
    if (filter === "NOT_PAID") return purchase.paymentStatus === "Not Paid";
    if (filter === "NOT_DELIVERED") return purchase.deliveryStatus === "Not Delivered";
    if (filter === "REFUNDED") {
      return (
        purchase.paymentStatus === "Refunded" ||
        purchase.deliveryStatus === "Refunded"
      );
    }
    if (filter === "EXPIRING_SOON") {
      return isExpiringSoon(purchase.expires) && purchase.deliveryStatus !== "Delivered";
    }
    return true;
  });

  const totalExpectedProfit = purchases
    .filter(
      (purchase) =>
        purchase.paymentStatus !== "Refunded" &&
        purchase.deliveryStatus !== "Refunded"
    )
    .reduce((sum, purchase) => sum + getStoredProfit(purchase), 0);

  const allTimeProfit = purchases
    .filter(
      (purchase) =>
        purchase.paymentStatus === "Paid" &&
        purchase.deliveryStatus !== "Refunded"
    )
    .reduce((sum, purchase) => sum + getStoredProfit(purchase), 0);

  const currentTotalProfit = useMemo(() => {
    return allTimeProfit - currentProfitBaseline;
  }, [allTimeProfit, currentProfitBaseline]);

  const unpaidCount = purchases.filter(
    (purchase) => purchase.paymentStatus === "Not Paid"
  ).length;

  const notDeliveredCount = purchases.filter(
    (purchase) => purchase.deliveryStatus === "Not Delivered"
  ).length;

  function handleResetCurrentProfit() {
    localStorage.setItem(CURRENT_PROFIT_BASELINE_KEY, allTimeProfit.toString());
    setCurrentProfitBaseline(allTimeProfit);
  }

  const total = Number(form.totalAmazon) || 0;
  const sellPerUnit = Number(form.sellPrice) || 0;
  const quantity = Number(form.quantity) || 0;
  const sell = sellPerUnit * quantity;
  const selectedRate = Number(form.cashbackRate) || 0;
  const cashbackAmount = total * (selectedRate / 100);
  const profitAmount = sell - total + cashbackAmount;

  // --- CONDITIONAL RENDER: LOGIN VS APP ---
  
  if (!token) {
    return (
      <div className="app-container">
        <div className="page-header">
          <h1 className="page-title">Powerbuy Arbitrage Tracker</h1>
        </div>
        <Auth onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-title">Powerbuy Arbitrage Tracker</h1>
        <div>
          <button
            className="theme-button"
            onClick={() => setDarkMode((current) => !current)}
            style={{ marginRight: '10px' }}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="theme-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
      <GmailSync token={token} onProcessed={loadPurchases} />
      <ReceiptUpload token={token} onProcessed={loadPurchases} />

      <PurchaseForm
        form={form}
        isEditing={isEditing}
        loading={loading}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        selectedRate={selectedRate}
        sell={sell}
        cashbackAmount={cashbackAmount}
        profitAmount={profitAmount}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <DashboardCards
        totalExpectedProfit={totalExpectedProfit}
        allTimeProfit={allTimeProfit}
        currentTotalProfit={currentTotalProfit}
        unpaidCount={unpaidCount}
        notDeliveredCount={notDeliveredCount}
        handleResetCurrentProfit={handleResetCurrentProfit}
      />
      <h2>Purchases</h2>
      <PurchaseFilters setFilter={setFilter} />
      <PurchasesTable
        filteredPurchases={filteredPurchases}
        getRowClassName={getRowClassName}
        toDateInputValue={toDateInputValue}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
      />
    </div>
  );
}

export default App;
