const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==========================================
// AUTHENTICATION API
// ==========================================

export async function register(email, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    // Try to grab the error message sent from the C# backend (e.g. "Email already in use.")
    const errorText = await res.text(); 
    throw new Error(errorText || `HTTP error! status: ${res.status}`);
  }

  // Returns your AuthResponse DTO: { token, userId, email }
  return res.json(); 
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP error! status: ${res.status}`);
  }

  // Returns your AuthResponse DTO: { token, userId, email }
  return res.json(); 
}


// ==========================================
// PURCHASES API
// ==========================================

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
