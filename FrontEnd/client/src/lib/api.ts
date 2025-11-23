export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  useAuth = true
): Promise<Response> {
  const headers: Record<string, string> = {};

  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  if (useAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res;
}

export async function apiGet<T>(url: string, useAuth = true): Promise<T> {
  const res = await apiRequest('GET', url, undefined, useAuth);
  return res.json();
}

export async function apiPost<T>(url: string, data: unknown, useAuth = true): Promise<T> {
  const res = await apiRequest('POST', url, data, useAuth);
  return res.json();
}

export async function apiPut<T>(url: string, data: unknown, useAuth = true): Promise<T> {
  const res = await apiRequest('PUT', url, data, useAuth);
  return res.json();
}

export async function apiDelete(url: string, useAuth = true): Promise<void> {
  await apiRequest('DELETE', url, undefined, useAuth);
}
