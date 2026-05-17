const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function parseError(res) {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json.error || text || `Error ${res.status}`;
  } catch {
    return text || `Error ${res.status}`;
  }
}

export async function getGmailAuthUrl(token) {
  const res = await fetch(`${API_BASE_URL}/api/gmail/auth-url`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await parseError(res));
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
  if (!res.ok) {
    const err = new Error(await parseError(res));
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function backfillEmailDates(token) {
  const res = await fetch(`${API_BASE_URL}/api/gmail/backfill-email-dates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = new Error(await parseError(res));
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function disconnectGmail(token) {
  const res = await fetch(`${API_BASE_URL}/api/gmail/disconnect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}
