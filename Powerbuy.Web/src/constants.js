export const today = new Date().toISOString().split("T")[0];

export const CURRENT_PROFIT_BASELINE_KEY = "powerbuyCurrentProfitBaseline";

export const emptyForm = {
  id: null,
  item: "",
  totalAmazon: "",
  sellPrice: "",
  cashbackRate: "5",
  orderPlaced: today,
  quantity: "",
  expires: "",
  upc: "",
  model: "",
  cardUsed: "Prime",
  boughtFrom: "Amazon",
  deliveryStatus: "Not Delivered",
  paymentStatus: "Not Paid",
  paymentDate: "",
  trackingNumber: "",
  quantityPaid: 0
};