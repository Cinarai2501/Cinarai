import type { UserRole } from '@/types/firestore';

export const allowedRoles = new Set<UserRole>(['student', 'teacher', 'admin']);

export function isAllowedUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && allowedRoles.has(role as UserRole);
}

export function resolveUserRoleFromProfileAndClaims(
  profileRole: unknown,
  claimsRole: unknown
): UserRole | null {
  if (profileRole !== undefined && profileRole !== null) {
    return isAllowedUserRole(profileRole) ? profileRole : null;
  }

  return claimsRole === 'student' ? 'student' : null;
}
