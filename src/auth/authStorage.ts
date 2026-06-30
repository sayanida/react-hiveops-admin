export interface User {
  staffId: string | number;
  name?: string;
  role?: string;
  permissions?: string[];
  email?: string;
}

const USER_KEY = "current_user";
const ROLE_KEY = "current_role";

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthUser(user: User | null | undefined): void {
  if (!user) return;

  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(ROLE_KEY, user.role ?? "");
}

export function getAuthUser(): User | null {
  const currentRaw = sessionStorage.getItem(USER_KEY);
  if (currentRaw) return safeParse(currentRaw) as User | null;

  return null;
}

export function getAuthRole(): string | null {
  return sessionStorage.getItem(ROLE_KEY) || null;
}

export function clearAuthUser(): void {
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}
