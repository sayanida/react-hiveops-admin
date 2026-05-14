const USER_KEY = "current_user";
const ROLE_KEY = "current_role";

// Optional fallback to keep compatibility with older mock testing
const LEGACY_USER_KEY = "mock_current_user";
const LEGACY_ROLE_KEY = "mock_current_role";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthUser(user) {
  if (!user) return;

  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(ROLE_KEY, user.role ?? "");
}

export function getAuthUser() {
  const currentRaw = sessionStorage.getItem(USER_KEY);
  if (currentRaw) return safeParse(currentRaw);

  const legacyRaw = localStorage.getItem(LEGACY_USER_KEY);
  if (legacyRaw) return safeParse(legacyRaw);

  return null;
}

export function getAuthRole() {
  return (
    sessionStorage.getItem(ROLE_KEY) ||
    localStorage.getItem(LEGACY_ROLE_KEY) ||
    null
  );
}

export function clearAuthUser() {
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}