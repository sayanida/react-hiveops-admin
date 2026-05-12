/*
Main.jsx
	The entry point of the app, mounts React to the DOM.
	•	Apply MUI theme (ThemeProvider) and global CSS reset (CssBaseline)
	•	Define routes (/, /admin, /staff) and set default redirect (/ → /staff)

Notes: Usually this file is not modified
  - serves as the foundation of the app
*/

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import Admin from "./pages/Admin.jsx";
import Staff from "./pages/Staff.jsx";
import Login from "./pages/Login.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import theme from "./theme.js";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import {
  ADMIN_ROLES,
  ROLES,
  getDefaultPathForRole,
  hasAllowedRole,
} from "./auth/roleAccess";

function HomeRedirect() {
  const { isAuthenticated, currentRole, currentUser } = useAuth();
  const role = currentRole || currentUser?.role;

  return (
    <Navigate
      to={isAuthenticated ? getDefaultPathForRole(role) : "/login"}
      replace
    />
  );
}

function LoginRoute() {
  const { isAuthenticated, currentRole, currentUser } = useAuth();
  const role = currentRole || currentUser?.role;

  return isAuthenticated ? (
    <Navigate to={getDefaultPathForRole(role)} replace />
  ) : (
    <Login />
  );
}

function ProtectedRoute({ allowedRoles, children }) {
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

function AppRoutes() {
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

      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={[ROLES.WORKER]}>
            <Staff />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
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