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
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import Admin from "./pages/Admin.jsx";
import Staff from "./pages/Staff.jsx";
import theme from "./theme.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/staff" replace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
