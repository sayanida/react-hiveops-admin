export const ROLES = {
  OFFICE_ADMIN: "OFFICE_ADMIN",
  MANAGER: "MANAGER",
  ROSTER_ADMIN: "ROSTER_ADMIN",
} as const;

export type Role = keyof typeof ROLES;

export const ADMIN_ROLES: Role[] = [
  ROLES.OFFICE_ADMIN,
  ROLES.MANAGER,
  ROLES.ROSTER_ADMIN,
];

export function normalizeRole(role: string | undefined | null): string {
  return (role || "").toUpperCase();
}

export function getDefaultPathForRole(role: string | undefined | null): string {
  const normalizedRole = normalizeRole(role);

  if (ADMIN_ROLES.includes(normalizedRole as Role)) return "/admin";

  return "/login";
}

export function hasAllowedRole(
  role: string | undefined | null,
  allowedRoles: string[] = [],
): boolean {
  return allowedRoles.includes(normalizeRole(role));
}
