const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getPurchases(token) {
  const res = await fetch(`${API_BASE_URL}/api/purchases`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  // Safely parse JSON only if the response is OK
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.status === 204 ? null : await res.json();
}

export async function createPurchase(purchase, token) {
  const res = await fetch(`${API_BASE_URL}/api/purchases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(purchase)
  });
  
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.status === 204 ? null : await res.json();
}

export async function updatePurchase(id, purchase, token) {
  const res = await fetch(`${API_BASE_URL}/api/purchases/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(purchase)
  });
  
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.status === 204 ? null : await res.json();
}

export async function deletePurchase(id, token) {
  const res = await fetch(`${API_BASE_URL}/api/purchases/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  
  // A DELETE request almost always returns 204 No Content. 
  // We don't even try to call res.json() here.
  return; 
}
