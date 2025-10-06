// Auth utilities for PHP-backed login

export type UserRole = 'user' | 'astrologer';

export interface PhpLoginResponse {
  status: 'success' | 'error';
  message?: string;
  unique_id?: string; // token from PHP
  // Note: PHP only returns unique_id, we'll use session storage for user details
}

export interface AuthSessionData {
  uniqueId: string;
  role: UserRole;
  userId?: string; // for user
  astrologerId?: string; // for astrologer
  name?: string;
  apiBaseUrl: string;
}

const STORAGE_KEY = 'chat_auth_session_v1';

export function getSession(): AuthSessionData | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSessionData;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSessionData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function loginViaPHP(params: {
  apiBaseUrl: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<AuthSessionData> {
  const { apiBaseUrl, email, password, role } = params;

  // Call server-side proxy to avoid CORS
  const res = await fetch('/api/php/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role, apiBaseUrl })
  });

  const data = (await res.json()) as PhpLoginResponse;

  if (data.status !== 'success' || !data.unique_id) {
    throw new Error(data.message || 'Login failed');
  }

  // Since PHP only returns unique_id, we'll use the login form data for user details
  const session: AuthSessionData = {
    uniqueId: String(data.unique_id),
    role,
    // For now, we'll use placeholder IDs - these should come from PHP session in real implementation
    userId: role === 'user' ? 'user_placeholder' : undefined,
    astrologerId: role === 'astrologer' ? 'astrologer_placeholder' : undefined,
    name: undefined, // Will be set when user starts chat
    apiBaseUrl
  };

  setSession(session);
  return session;
}
