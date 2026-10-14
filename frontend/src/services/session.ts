const KEY = 'tdb_session';
export const AUTH_EXPIRED = 'tdb:auth-expired';
interface StoredSession { token: string; expiresAt: string }
export function readSession(): StoredSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return value && typeof value.token === 'string' && typeof value.expiresAt === 'string' ? value : null;
  } catch { return null; }
}
export function saveSession(session: StoredSession) {
  sessionStorage.setItem(KEY, JSON.stringify({ token: session.token, expiresAt: session.expiresAt }));
}
export function clearSession() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem('tdb_auth_user');
}
