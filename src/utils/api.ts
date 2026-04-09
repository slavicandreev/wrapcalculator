// Centralized fetch wrapper — works with both WP REST API and Vercel

interface WPConfig {
  apiBase: string;
  nonce: string;
}

declare global {
  interface Window {
    wrapmatchproConfig?: WPConfig;
  }
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (window.wrapmatchproConfig?.nonce) {
    headers['X-WP-Nonce'] = window.wrapmatchproConfig.nonce;
  }
  return headers;
}

function getApiUrl(path: string): string {
  const base = window.wrapmatchproConfig?.apiBase;
  if (base) {
    return `${base}${path}`;
  }
  // Vercel fallback
  const vercelPaths: Record<string, string> = {
    '/submit-quote': '/api/send-quote',
    '/detect-color': '/api/detect-wrap-color',
    '/generate-wrap': '/api/generate-wrap',
  };
  return vercelPaths[path] ?? `/api${path}`;
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(getApiUrl(path), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  return res.json() as Promise<T>;
}
