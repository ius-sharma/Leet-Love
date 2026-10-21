// Intentionally server-authoritative: widening access requires an explicit code change.
export const OWNER_EMAIL = 'sharmaeditzayush@gmail.com';
export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function isOwnerEmail(value: unknown): boolean {
  return typeof value === 'string' && normalizeEmail(value) === OWNER_EMAIL;
}
type Candidate = { email?: string; email_confirmed_at?: string; is_anonymous?: boolean;
  identities?: { provider?: string; identity_data?: Record<string, unknown> }[] };
export function isOwnerUser(user: Candidate | null | undefined): boolean {
  return !!user && !user.is_anonymous && isOwnerEmail(user.email) && !!user.email_confirmed_at &&
    !!user.identities?.some(i => i.provider === 'google' && isOwnerEmail(i.identity_data?.email) && i.identity_data?.email_verified === true);
}
export function isGoogleSession(claims: Record<string, unknown> | null | undefined): boolean {
  return Array.isArray(claims?.amr) && claims.amr.some((entry: unknown) =>
    !!entry && typeof entry === 'object' && 'method' in entry && entry.method === 'oauth');
}
export function safeNext(value: unknown): string {
  if(typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n%]/.test(value)) return '/arrays';
  try { const url=new URL(value,'https://leetlove.invalid');
    return url.origin==='https://leetlove.invalid' && /^\/(arrays|problems|learn|create)(\/|$)/.test(url.pathname) ? url.pathname+url.search : '/arrays';
  } catch { return '/arrays'; }
}
