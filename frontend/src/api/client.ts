// API Response type
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const API_BASE = '/api';

// Generic fetch wrapper
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data: APIResponse<T> = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data.data as T;
}

// GET request helper
async function get<T>(endpoint: string): Promise<T> {
  return fetchAPI<T>(endpoint, { method: 'GET' });
}

// POST request helper
async function post<T>(endpoint: string, body: unknown): Promise<T> {
  return fetchAPI<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// DELETE request helper
async function del<T>(endpoint: string): Promise<T> {
  return fetchAPI<T>(endpoint, { method: 'DELETE' });
}

export const api = {
  get,
  post,
  delete: del,
};

export default api;
