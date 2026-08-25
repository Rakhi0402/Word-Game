/** Accepts ROLE_ADMIN, ADMIN, or case variants from API/JWT. */
export function isAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  const n = role.trim().toUpperCase();
  return n === 'ROLE_ADMIN' || n === 'ADMIN';
}
