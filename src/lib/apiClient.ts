import { clientEnv } from './env';
import { getSupabaseClient } from './supabase';

const SANDBOX_TOKEN_KEY = 'kodera_dev_sandbox_token';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getSandboxToken(): string | null {
  if (!clientEnv.isLocalSandbox || typeof window === 'undefined') return null;
  return window.localStorage.getItem(SANDBOX_TOKEN_KEY);
}

export function setSandboxToken(token: string | null): void {
  if (!clientEnv.isLocalSandbox || typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(SANDBOX_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(SANDBOX_TOKEN_KEY);
  }
}

async function resolveAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
  return getSandboxToken();
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    auth?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await resolveAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const errObj =
      parsed && typeof parsed === 'object' && 'error' in parsed
        ? (parsed as { error?: { message?: string; code?: string; details?: unknown } }).error
        : undefined;
    throw new ApiError(
      errObj?.message || `Sorğu uğursuz oldu (HTTP ${response.status}).`,
      response.status,
      errObj?.code || 'HTTP_ERROR',
      errObj?.details,
    );
  }

  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return (parsed as { data: T }).data;
  }

  return parsed as T;
}
