const USER_KEY = "current_user";
const ROLE_KEY = "current_role";

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

  return null;
}

export function getAuthRole() {
  return sessionStorage.getItem(ROLE_KEY) || null;
}

export function clearAuthUser() {
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}
