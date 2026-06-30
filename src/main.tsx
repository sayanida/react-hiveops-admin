/*
Main.tsx
	The entry point of the app, mounts React to the DOM.
	•	Apply MUI theme (ThemeProvider) and global CSS reset (CssBaseline)
	•	Define routes (/, /admin) and set default redirect (/ → /admin)

Notes: Usually this file is not modified
  - serves as the foundation of the app
*/

import { StrictMode, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import theme from "./theme";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import {
  ADMIN_ROLES,
  getDefaultPathForRole,
  hasAllowedRole,
} from "./auth/roleAccess";

function HomeRedirect(): ReactNode {
  const { isAuthenticated, currentRole, currentUser } = useAuth();
  const role = currentRole || currentUser?.role;

  return (
    <Navigate
      to={isAuthenticated ? getDefaultPathForRole(role) : "/login"}
      replace
    />
  );
}

function LoginRoute(): ReactNode {
  const { isAuthenticated, currentRole, currentUser } = useAuth();
  const role = currentRole || currentUser?.role;

  return isAuthenticated ? (
    <Navigate to={getDefaultPathForRole(role)} replace />
  ) : (
    <Login />
  );
}

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: ReactNode;
}

function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps): ReactNode {
  const { isAuthenticated, currentRole, currentUser } = useAuth();
  const role = currentRole || currentUser?.role;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAllowedRole(role, allowedRoles)) {
    return <Unauthorized />;
  }

  return children;
}

function AppRoutes(): ReactNode {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginRoute />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
