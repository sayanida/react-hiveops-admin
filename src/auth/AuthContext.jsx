import { createContext, useContext, useMemo, useState } from "react";
import { loginUser } from "../utils/api";
import { clearAuthUser, getAuthRole, getAuthUser, saveAuthUser } from "./authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getAuthUser());
  const [currentRole, setCurrentRole] = useState(() => getAuthRole());

  const login = async ({ email, password }) => {
    const user = await loginUser({ email, password });

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