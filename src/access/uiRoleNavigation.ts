export const UI_ROLE_STORAGE_KEY = "mock_current_role";
export const UI_CURRENT_USER_STORAGE_KEY = "mock_current_user";

export interface MockScope {
  siteId: string;
  siteName: string;
  teamId: string;
  teamName: string;
  allowedStaffIds: string[];
}

export const MOCK_ROSTER_ADMIN_ASSIGNED_SCOPE: MockScope = {
  siteId: "SITE-01",
  siteName: "North Farm",
  teamId: "TEAM-A",
  teamName: "Harvest Team A",
  allowedStaffIds: ["1", "101", "401"],
};

export interface UserProfile {
  staffId: string | number;
  name?: string;
  role?: string;
  permissions?: string[];
  email?: string;
  assignedScope?: MockScope;
  userName?: string;
  username?: string;
  displayName?: string;
  fullName?: string;
}

interface MockAuthUser {
  request: { email: string; password: string };
  response: UserProfile;
}

const DEFAULT_MOCK_ADMIN_USER: UserProfile = {
  staffId: "A-001",
  name: "Sayanida",
  role: "OFFICE_ADMIN",
};

export const MOCK_AUTH_LOGIN_USERS: MockAuthUser[] = [
  {
    request: { email: "admin@beerenberg.com.au", password: "password123" },
    response: {
      staffId: "A-001",
      name: "Sayanida",
      role: "OFFICE_ADMIN",
      permissions: ["ADMIN_PORTAL"],
    },
  },
  {
    request: { email: "frodo@farm.com", password: "password123" },
    response: {
      staffId: 402,
      name: "Frodo Baggins",
      role: "MANAGER",
      permissions: ["ROSTER_VIEW", "REPORT_VIEW"],
    },
  },
  {
    request: { email: "samwise@farm.com", password: "password123" },
    response: {
      staffId: 403,
      name: "Samwise Gamgee",
      role: "ROSTER_ADMIN",
      permissions: ["ROSTER_VIEW", "ROSTER_MANAGE"],
      assignedScope: MOCK_ROSTER_ADMIN_ASSIGNED_SCOPE,
    },
  },
];

export const ROLE_CODES = {
  OFFICE_ADMIN: "OFFICE_ADMIN",
  MANAGER: "MANAGER",
  ROSTER_ADMIN: "ROSTER_ADMIN",
} as const;

export type RoleCode = keyof typeof ROLE_CODES;

export const ROLE_DEFINITIONS = [
  { id: 1, name: ROLE_CODES.OFFICE_ADMIN },
  { id: 2, name: ROLE_CODES.MANAGER },
  { id: 3, name: ROLE_CODES.ROSTER_ADMIN },
];

export const ROLE_LABELS: Record<string, string> = {
  [ROLE_CODES.OFFICE_ADMIN]: "Office Admin",
  [ROLE_CODES.MANAGER]: "Manager / Supervisor",
  [ROLE_CODES.ROSTER_ADMIN]: "Roster Admin",
};

const ROLE_ALIASES: Record<string, string> = {
  OFFICEADMIN: ROLE_CODES.OFFICE_ADMIN,
  "OFFICE ADMIN": ROLE_CODES.OFFICE_ADMIN,
  SYSTEM_ADMINISTRATOR: ROLE_CODES.OFFICE_ADMIN,
  SUPERVISOR: ROLE_CODES.MANAGER,
  "MANAGER/SUPERVISOR": ROLE_CODES.MANAGER,
};

const ADMIN_TAB_IDS_BY_ROLE: Record<string, string[]> = {
  [ROLE_CODES.OFFICE_ADMIN]: [
    "staff",
    "roster",
    "stations",
    "clocking",
    "registrations",
    "reports",
    "exceptions",
    "settings",
  ],
  [ROLE_CODES.MANAGER]: ["stations", "clocking", "reports", "exceptions"],
  [ROLE_CODES.ROSTER_ADMIN]: ["roster"],
};

const PORTAL_BY_ROLE: Record<string, string> = {
  [ROLE_CODES.OFFICE_ADMIN]: "admin",
  [ROLE_CODES.MANAGER]: "admin",
  [ROLE_CODES.ROSTER_ADMIN]: "admin",
};

export interface AdminTab {
  id: string;
  label?: string;
}

export function normalizeRole(rawRole: string | undefined | null): string {
  if (!rawRole) return ROLE_CODES.OFFICE_ADMIN;
  const candidate = String(rawRole).trim().toUpperCase();
  if (ROLE_LABELS[candidate]) return candidate;
  return ROLE_ALIASES[candidate] || ROLE_CODES.OFFICE_ADMIN;
}

export function getUiCurrentRole(): string {
  if (typeof window === "undefined") return ROLE_CODES.OFFICE_ADMIN;

  const savedRole =
    window.localStorage.getItem(UI_ROLE_STORAGE_KEY) ||
    window.sessionStorage.getItem(UI_ROLE_STORAGE_KEY);

  if (savedRole && String(savedRole).trim()) {
    return normalizeRole(savedRole);
  }

  const currentUser = getUiCurrentUserProfile();
  return normalizeRole(currentUser?.role);
}

export function getRoleLabel(role: string | undefined | null): string {
  const normalized = normalizeRole(role);
  return ROLE_LABELS[normalized] || ROLE_LABELS[ROLE_CODES.OFFICE_ADMIN];
}

export function getVisibleAdminTabs(
  role: string | undefined | null,
  tabs: AdminTab[],
): AdminTab[] {
  const normalized = normalizeRole(role);
  const allowed = new Set(ADMIN_TAB_IDS_BY_ROLE[normalized] || []);
  return tabs.filter((tab) => allowed.has(tab.id));
}

export function getFirstVisibleAdminTab(
  role: string | undefined | null,
  tabs: AdminTab[],
): string | null {
  const firstTab = getVisibleAdminTabs(role, tabs)[0];
  return firstTab?.id ?? null;
}

export function getFirstVisiblePortal(role: string | undefined | null): string {
  const normalized = normalizeRole(role);
  return PORTAL_BY_ROLE[normalized] || "admin";
}

function readStorageValue(key: string): string {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem(key) || window.sessionStorage.getItem(key) || ""
  );
}

function parseUserCandidate(rawValue: string | null): UserProfile | null {
  if (!rawValue) return null;

  if (rawValue.trim().startsWith("{")) {
    try {
      return JSON.parse(rawValue) as UserProfile;
    } catch {
      return null;
    }
  }

  return { name: rawValue, staffId: "" };
}

export function getUiCurrentUserProfile(): UserProfile | null {
  const keys = [
    UI_CURRENT_USER_STORAGE_KEY,
    "current_user",
    "currentUser",
    "auth_user",
  ];

  for (const key of keys) {
    const parsed = parseUserCandidate(readStorageValue(key));
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  }

  return null;
}

export function getUiCurrentUserName(): string {
  const parsed = getUiCurrentUserProfile();
  if (parsed) {
    const candidate =
      parsed.name ||
      parsed.userName ||
      parsed.username ||
      parsed.displayName ||
      parsed.fullName ||
      parsed.email;

    if (candidate && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  return "Admin User";
}

export function getUiCurrentUserPermissions(): string[] {
  const parsed = getUiCurrentUserProfile();
  const permissions = parsed?.permissions;
  if (!Array.isArray(permissions)) return [];

  return permissions
    .map((item) => String(item || "").trim())
    .filter((item) => Boolean(item));
}

export function ensureDefaultMockAdminSession(): void {
  if (typeof window === "undefined") return;

  const hasRole =
    Boolean(window.localStorage.getItem(UI_ROLE_STORAGE_KEY)) ||
    Boolean(window.sessionStorage.getItem(UI_ROLE_STORAGE_KEY));

  if (!hasRole) {
    window.localStorage.setItem(UI_ROLE_STORAGE_KEY, ROLE_CODES.OFFICE_ADMIN);
  }

  const hasUser =
    Boolean(window.localStorage.getItem(UI_CURRENT_USER_STORAGE_KEY)) ||
    Boolean(window.sessionStorage.getItem(UI_CURRENT_USER_STORAGE_KEY));

  if (!hasUser) {
    window.localStorage.setItem(
      UI_CURRENT_USER_STORAGE_KEY,
      JSON.stringify(DEFAULT_MOCK_ADMIN_USER),
    );
  }
}
