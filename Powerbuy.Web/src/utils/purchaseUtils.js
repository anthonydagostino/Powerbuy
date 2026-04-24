export function toDateInputValue(dateString) {
  if (!dateString) return "";
  return dateString.split("T")[0];
}

export function getStoredProfit(purchase) {
  return (
    purchase.profit7Percent ||
    purchase.profit6Percent ||
    purchase.profit5Percent ||
    0
  );
}

export function getCashbackRateFromPurchase(purchase) {
  if ((purchase.cashback7Percent ?? 0) > 0) return "7";
  if ((purchase.cashback6Percent ?? 0) > 0) return "6";
  return "5";
}

export function isExpiringSoon(expires) {
  if (!expires) return false;

  const now = new Date();
  const expireDate = new Date(expires);
  const diffInMs = expireDate - now;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  return diffInDays >= 0 && diffInDays <= 3;
}

export function getRowClassName(purchase) {
  if (
    purchase.deliveryStatus === "Refunded" ||
    purchase.paymentStatus === "Refunded"
  ) {
    return "row-refunded";
  }

  // ✅ MAKE HALF PURPLE (put this EARLY)
  if (purchase.paymentStatus === "Half") {
    return "row-half";
  }

  if (
    purchase.paymentStatus === "Paid" &&
    purchase.deliveryStatus === "Not Delivered"
  ) {
    return "row-paid-not-delivered";
  }

  if (
    isExpiringSoon(purchase.expires) &&
    purchase.deliveryStatus !== "Delivered"
  ) {
    return "row-expiring";
  }

  if (purchase.paymentStatus === "Not Paid") {
    return "row-not-paid";
  }

  if (purchase.deliveryStatus === "Not Delivered") {
    return "row-not-delivered";
  }

  return "";
}

export function buildPurchasePayload(form) {
  const total = Number(form.totalAmazon);
  const sellPerUnit = Number(form.sellPrice);
  const quantity = Number(form.quantity);
  const sell = sellPerUnit * quantity;
  const selectedRate = Number(form.cashbackRate);

  const cashback5 = selectedRate === 5 ? total * 0.05 : 0;
  const cashback6 = selectedRate === 6 ? total * 0.06 : 0;
  const cashback7 = selectedRate === 7 ? total * 0.07 : 0;

  const profit5 = selectedRate === 5 ? sell - total + cashback5 : 0;
  const profit6 = selectedRate === 6 ? sell - total + cashback6 : 0;
  const profit7 = selectedRate === 7 ? sell - total + cashback7 : 0;

  return {
    id: form.id,
    item: form.item,
    totalAmazon: total,
    sellPrice: sell,
    cashback5Percent: cashback5,
    cashback6Percent: cashback6,
    cashback7Percent: cashback7,
    profit5Percent: profit5,
    profit6Percent: profit6,
    profit7Percent: profit7,
    orderPlaced: `${form.orderPlaced}T00:00:00Z`,
    quantity,
    expires: `${form.expires}T00:00:00Z`,
    upc: form.upc,
    model: form.model,
    cardUsed: form.cardUsed,
    boughtFrom: form.boughtFrom,
    deliveryStatus: form.deliveryStatus,
    paymentStatus: form.paymentStatus,
    paymentDate: form.paymentDate ? `${form.paymentDate}T00:00:00Z` : null,
    trackingNumber: form.trackingNumber || null,
    quantityPaid: Number(form.quantityPaid)
  };
}