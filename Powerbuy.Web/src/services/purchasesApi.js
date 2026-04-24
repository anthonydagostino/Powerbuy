const API_URL = "http://localhost:5053/api/Purchases";

export async function getPurchases() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to load purchases.");
  return await response.json();
}

export async function createPurchase(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error("Failed to create purchase.");
}

export async function updatePurchase(id, payload) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error("Failed to update purchase.");
}

export async function deletePurchase(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) throw new Error("Failed to delete purchase.");
}