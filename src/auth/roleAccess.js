export const ROLES = {
  OFFICE_ADMIN: "OFFICE_ADMIN",
  MANAGER: "MANAGER",
  ROSTER_ADMIN: "ROSTER_ADMIN",
  WORKER: "WORKER",
};

export const ADMIN_ROLES = [
  ROLES.OFFICE_ADMIN,
  ROLES.MANAGER,
  ROLES.ROSTER_ADMIN,
];

export function normalizeRole(role) {
  return (role || "").toUpperCase();
}

export function getDefaultPathForRole(role) {
  const normalizedRole = normalizeRole(role);

  if (ADMIN_ROLES.includes(normalizedRole)) return "/admin";

  return "/login";
}

export function hasAllowedRole(role, allowedRoles = []) {
  return allowedRoles.includes(normalizeRole(role));
}
