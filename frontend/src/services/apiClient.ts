import type { ApiEnvelope } from '../types/auth';
import { ApiClientError } from '../types/auth';

const AUTH_STORAGE_KEY = 'kungfu_auth';

/**
 * Token storage: access + refresh in localStorage (SPA-friendly).
 * Trade-off: XSS can read tokens — mitigate with CSP and careful deps.
 * Prefer HttpOnly cookies in a future hardened deployment.
 */
export function readStoredAuth(): {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  username: string | null;
  isAuthenticated: boolean;
} | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return readStoredAuth()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return readStoredAuth()?.refreshToken ?? null;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';

type TokenUpdater = (tokens: {
  accessToken: string;
  refreshToken: string | null;
}) => void;

let onTokensUpdated: TokenUpdater | null = null;
let onUnauthorized: (() => void) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function configureApiClient(opts: {
  onTokensUpdated?: TokenUpdater;
  onUnauthorized?: () => void;
}) {
  onTokensUpdated = opts.onTokensUpdated ?? null;
  onUnauthorized = opts.onUnauthorized ?? null;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const body = (await res.json()) as ApiEnvelope<{
        accessToken: string;
        refreshToken?: string;
      }>;
      if (!res.ok || !body.success || !body.data?.accessToken) {
        return null;
      }
      const next = {
        accessToken: body.data.accessToken,
        refreshToken: body.data.refreshToken ?? refreshToken,
      };
      onTokensUpdated?.(next);
      return next.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; retry?: boolean } = {}
): Promise<T> {
  const { skipAuth, retry = true, headers, ...rest } = options;
  const hdrs = new Headers(headers);
  if (!hdrs.has('Content-Type') && rest.body) {
    hdrs.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) hdrs.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers: hdrs });
  } catch (netErr) {
    // #region agent log
    if (path.includes('/puzzles/')) {
      fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'pre-fix',hypothesisId:'A',location:'apiClient.ts:network',message:'Puzzle API network failure',data:{path,apiBase:API_BASE||'(empty-proxy)',err:netErr instanceof Error?netErr.message:String(netErr)},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion
    throw new ApiClientError(
      'Cannot reach the server. Check that the backend is running.',
      0,
      { code: 'NETWORK_ERROR' }
    );
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    const rawText = await res.text();
    body = rawText ? (JSON.parse(rawText) as ApiEnvelope<T>) : null;
  } catch {
    body = null;
  }

  if (res.status === 401 && !skipAuth && retry && !path.includes('/auth/login')) {
    // #region agent log
    fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'jwt-debug',hypothesisId:'A',location:'apiClient.ts:401',message:'API returned 401, attempting refresh',data:{path,status:res.status,errorMsg:body?.error?.message||body?.message||null,hasRefresh:Boolean(getRefreshToken())},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      // #region agent log
      fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'jwt-debug',hypothesisId:'B',location:'apiClient.ts:refresh-ok',message:'Token refresh succeeded',data:{path},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return apiRequest<T>(path, { ...options, retry: false });
    }
    // #region agent log
    fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'jwt-debug',hypothesisId:'B',location:'apiClient.ts:refresh-fail',message:'Token refresh failed; forcing logout path',data:{path,errorMsg:body?.error?.message||body?.message||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    onUnauthorized?.();
    throw new ApiClientError(body?.error?.message || body?.message || 'Unauthorized', 401, {
      code: body?.error?.code,
    });
  }

  if (!res.ok || body?.success === false) {
    // #region agent log
    if (path.includes('/puzzles/')) {
      fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'pre-fix',hypothesisId:'A',location:'apiClient.ts:http-error',message:'Puzzle API non-OK response',data:{path,status:res.status,success:body?.success??null,msg:body?.error?.message||body?.message||null,code:body?.error?.code??null},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion
    const fieldErrors =
      body?.data && typeof body.data === 'object' && !Array.isArray(body.data)
        ? (body.data as unknown as Record<string, string>)
        : undefined;

    const isValidation = res.status === 400 && fieldErrors && Object.keys(fieldErrors).length > 0;

    throw new ApiClientError(
      body?.error?.message || body?.message || `Request failed (${res.status})`,
      res.status,
      {
        code: body?.error?.code,
        fieldErrors: isValidation ? fieldErrors : undefined,
      }
    );
  }

  return body!.data as T;
}

export { API_BASE, AUTH_STORAGE_KEY };
