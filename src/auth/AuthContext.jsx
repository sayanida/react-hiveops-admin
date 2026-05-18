import { createContext, useContext, useMemo, useState } from "react";
import {
  clearAuthUser,
  getAuthRole,
  getAuthUser,
  saveAuthUser,
} from "./authStorage";
import { MOCK_AUTH_LOGIN_USERS } from "../access/uiRoleNavigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getAuthUser());
  const [currentRole, setCurrentRole] = useState(() => getAuthRole());

  const login = async ({ email, password }) => {
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
      const error = new Error("Invalid email or password.");
      error.response = {
        status: 401,
        data: "Invalid email or password.",
      };
      throw error;
    }

    const user = matched.response;

    const normalizedUser = {
      ...user,
      email,
      permissions: user.permissions ?? [],
    };

    saveAuthUser(normalizedUser);
    setCurrentUser(normalizedUser);
    setCurrentRole(normalizedUser.role ?? null);

    return normalizedUser;
  };

  const logout = () => {
    clearAuthUser();
    setCurrentUser(null);
    setCurrentRole(null);
  };

  const value = useMemo(
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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
