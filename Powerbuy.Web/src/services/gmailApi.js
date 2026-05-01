const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getGmailAuthUrl(token) {
  const res = await fetch(`${API_BASE_URL}/api/gmail/auth-url`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
  return res.json();
}

export async function getGmailStatus(token) {
  const res = await fetch(`${API_BASE_URL}/api/gmail/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function syncGmailReceipts(token, days = 3) {
  const res = await fetch(`${API_BASE_URL}/api/gmail/process`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
  });
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
  return res.json();
}

export async function disconnectGmail(token) {
  const res = await fetch(`${API_BASE_URL}/api/gmail/disconnect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}
