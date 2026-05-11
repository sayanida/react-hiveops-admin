export const UI_ROLE_STORAGE_KEY = "mock_current_role";
export const UI_CURRENT_USER_STORAGE_KEY = "mock_current_user";

const DEFAULT_MOCK_ADMIN_USER = {
  staffId: "A-001",
  name: "Saya Yoshida",
  role: "OFFICE_ADMIN",
};

export const MOCK_AUTH_LOGIN_USERS = [
  {
    request: { email: "bilbo@farm.com", password: "password123" },
    response: {
      staffId: 401,
      name: "Bilbo Baggins",
      role: "WORKER",
      permissions: ["CLOCK_USE"],
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
];

export const ROLE_CODES = {
  OFFICE_ADMIN: "OFFICE_ADMIN",
  MANAGER: "MANAGER",
  ROSTER_ADMIN: "ROSTER_ADMIN",
  WORKER: "WORKER",
};

export const ROLE_DEFINITIONS = [
  { id: 1, name: ROLE_CODES.OFFICE_ADMIN },
  { id: 2, name: ROLE_CODES.MANAGER },
  { id: 3, name: ROLE_CODES.ROSTER_ADMIN },
  { id: 4, name: ROLE_CODES.WORKER },
];

export const ROLE_LABELS = {
  [ROLE_CODES.OFFICE_ADMIN]: "Office Admin",
  [ROLE_CODES.MANAGER]: "Manager / Supervisor",
  [ROLE_CODES.ROSTER_ADMIN]: "Roster Admin",
  [ROLE_CODES.WORKER]: "Worker",
};

const ROLE_ALIASES = {
  OFFICEADMIN: ROLE_CODES.OFFICE_ADMIN,
  "OFFICE ADMIN": ROLE_CODES.OFFICE_ADMIN,
  SYSTEM_ADMINISTRATOR: ROLE_CODES.OFFICE_ADMIN,
  SUPERVISOR: ROLE_CODES.MANAGER,
  "MANAGER/SUPERVISOR": ROLE_CODES.MANAGER,
};

const ADMIN_TAB_IDS_BY_ROLE = {
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
  [ROLE_CODES.WORKER]: [],
};

const PORTAL_BY_ROLE = {
  [ROLE_CODES.OFFICE_ADMIN]: "admin",
  [ROLE_CODES.MANAGER]: "admin",
  [ROLE_CODES.ROSTER_ADMIN]: "admin",
  [ROLE_CODES.WORKER]: "staff",
};

export function normalizeRole(rawRole) {
  if (!rawRole) return ROLE_CODES.WORKER;
  const candidate = String(rawRole).trim().toUpperCase();
  if (ROLE_LABELS[candidate]) return candidate;
  return ROLE_ALIASES[candidate] || ROLE_CODES.WORKER;
}

export function getUiCurrentRole() {
  if (typeof window === "undefined") return ROLE_CODES.WORKER;

  const savedRole =
    window.localStorage.getItem(UI_ROLE_STORAGE_KEY) ||
    window.sessionStorage.getItem(UI_ROLE_STORAGE_KEY);

  if (savedRole && String(savedRole).trim()) {
    return normalizeRole(savedRole);
  }

  const currentUser = getUiCurrentUserProfile();
  return normalizeRole(currentUser?.role);
}

export function getRoleLabel(role) {
  const normalized = normalizeRole(role);
  return ROLE_LABELS[normalized] || ROLE_LABELS[ROLE_CODES.WORKER];
}

export function getVisibleAdminTabs(role, tabs) {
  const normalized = normalizeRole(role);
  const allowed = new Set(ADMIN_TAB_IDS_BY_ROLE[normalized] || []);
  return tabs.filter((tab) => allowed.has(tab.id));
}

export function getFirstVisibleAdminTab(role, tabs) {
  const firstTab = getVisibleAdminTabs(role, tabs)[0];
  return firstTab?.id ?? null;
}

export function getFirstVisiblePortal(role) {
  const normalized = normalizeRole(role);
  return PORTAL_BY_ROLE[normalized] || "staff";
}

function readStorageValue(key) {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem(key) || window.sessionStorage.getItem(key) || ""
  );
}

function parseUserCandidate(rawValue) {
  if (!rawValue) return null;

  if (rawValue.trim().startsWith("{")) {
    try {
      return JSON.parse(rawValue);
    } catch {
      return null;
    }
  }

  return { name: rawValue };
}

export function getUiCurrentUserProfile() {
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

export function getUiCurrentUserName() {
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

export function getUiCurrentUserPermissions() {
  const parsed = getUiCurrentUserProfile();
  const permissions = parsed?.permissions;
  if (!Array.isArray(permissions)) return [];

  return permissions
    .map((item) => String(item || "").trim())
    .filter((item) => Boolean(item));
}

export function ensureDefaultMockAdminSession() {
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
