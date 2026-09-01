// Points at the reviews-api dev server through the current cloudflared quick
// tunnel (`cloudflared tunnel --url http://localhost:3001`). This hostname is
// regenerated every time that tunnel restarts — re-sync it when that happens,
// and swap it for a stable production URL before shipping.
export const API_BASE_URL = 'https://cold-vienna-serial-dig.trycloudflare.com'; 

// This is a ui_extension (admin.app.home.render), not a classic embedded app,
// so there's no @shopify/app-bridge here — shopify.auth.idToken() is the
// extension-surface equivalent of App Bridge's getSessionToken().
async function authHeaders() {
  try {
    const token = await shopify.auth.idToken();
    return token ? {Authorization: `Bearer ${token}`} : {};
  } catch (_) {
    return {};
  }
}

export async function apiRequest(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
      ...(options?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}
