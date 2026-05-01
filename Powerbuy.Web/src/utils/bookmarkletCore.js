// Pure functions shared between BookmarkletSetup, PurchaseImportDialog, and tests.

export function shouldRecordWatchChange(newVal, oldVal) {
  // Ignore the initial $watch call (newVal === oldVal) and Angular
  // scope initialization when COMMIT is clicked (oldVal === undefined).
  // Only record when the user actually types a new value.
  return newVal !== oldVal && oldVal !== undefined;
}

export function encodeDeals(deals) {
  return btoa(encodeURIComponent(JSON.stringify(deals)));
}

export function decodeDeals(encoded) {
  return JSON.parse(decodeURIComponent(atob(encoded)));
}

export function calcProfit(deal, cashbackRate) {
  const rate = Number(cashbackRate);
  const sell = deal.sellPricePerUnit * deal.qty;
  const amazon = deal.totalAmazon;
  return sell - amazon + amazon * (rate / 100);
}

export function buildPurchasePayload(deal, cashbackRate) {
  const rate = Number(cashbackRate);
  const sell = deal.sellPricePerUnit * deal.qty;
  const total = deal.totalAmazon;
  const today = new Date().toISOString().split('T')[0];
  const expires = deal.expires || today;

  return {
    item: deal.item,
    upc: deal.upc,
    model: deal.model,
    totalAmazon: total,
    sellPrice: sell,
    cashback5Percent: rate === 5 ? total * 0.05 : 0,
    cashback6Percent: rate === 6 ? total * 0.06 : 0,
    cashback7Percent: rate === 7 ? total * 0.07 : 0,
    profit5Percent: rate === 5 ? sell - total + total * 0.05 : 0,
    profit6Percent: rate === 6 ? sell - total + total * 0.06 : 0,
    profit7Percent: rate === 7 ? sell - total + total * 0.07 : 0,
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
