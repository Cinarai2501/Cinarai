import type { UserRole } from '@/types/firestore';

export const allowedRoles = new Set<UserRole>(['student', 'teacher', 'admin']);

export function isAllowedUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && allowedRoles.has(role as UserRole);
}

export function resolveUserRoleFromProfile(profileRole: unknown): UserRole | null {
  if (typeof profileRole === 'string' && allowedRoles.has(profileRole as UserRole)) {
    return profileRole as UserRole;
  }

  return null;
}
