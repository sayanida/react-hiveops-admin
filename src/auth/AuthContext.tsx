import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import {
  clearAuthUser,
  getAuthRole,
  getAuthUser,
  saveAuthUser,
  User,
} from "./authStorage";
import { MOCK_AUTH_LOGIN_USERS } from "../access/uiRoleNavigation";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  currentUser: User | null;
  currentRole: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getAuthUser(),
  );
  const [currentRole, setCurrentRole] = useState<string | null>(() =>
    getAuthRole(),
  );

  const login = async ({
    email,
    password,
  }: LoginCredentials): Promise<User> => {
    const emailKey = String(email || "")
      .trim()
      .toLowerCase();
    const passwordKey = String(password || "");

    const matched = MOCK_AUTH_LOGIN_USERS.find((candidate) => {
      const candidateEmail = String(candidate?.request?.email || "")
        .trim()
        .toLowerCase();
      const candidatePassword = String(candidate?.request?.password || "");
      return candidateEmail === emailKey && candidatePassword === passwordKey;
    });

    if (!matched) {
      const error = new Error("Invalid email or password.") as Error & {
        response?: { status: number; data: string };
      };
      error.response = {
        status: 401,
        data: "Invalid email or password.",
      };
      throw error;
    }

    const user = matched.response;

    const normalizedUser: User = {
      ...user,
      email,
      permissions: user.permissions ?? [],
    };

    saveAuthUser(normalizedUser);
    setCurrentUser(normalizedUser);
    setCurrentRole(normalizedUser.role ?? null);

    return normalizedUser;
  };

  const logout = (): void => {
    clearAuthUser();
    setCurrentUser(null);
    setCurrentRole(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      currentRole,
      isAuthenticated: !!currentUser,
      login,
      logout,
    }),
    [currentUser, currentRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
