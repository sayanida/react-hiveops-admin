/*
Admin.jsx
	Entry page for the admin dashboard
	•	Wraps child components (AdminTopbar, AdminSidebar, tab components) with QueryClientProvider
  •	Manages tab switching and toast notifications
	•	Contains AdminApp (state management) and TABS (tab settings)
	•	Exports adminApi for API calls
*/

import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert, Box, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useToast from "../hooks/useToast.js";
import Toast from "../components/common/Toast.jsx";
import AdminTopbar from "../components/admin/AdminTopbar.jsx";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";
import { adminApi as api } from "../utils/api.js";

import StaffTab from "../tabs/StaffTab.jsx";
import RosterTab from "../tabs/RosterTab.jsx";
import StationsTab from "../tabs/StationsTab.jsx";
import ClockingTab from "../tabs/ClockingTab.jsx";
import RegistrationsTab from "../tabs/RegistrationsTab.jsx";
import ReportsTab from "../tabs/ReportsTab.jsx";
import ExceptionsTab from "../tabs/ExceptionsTab.jsx";
import SettingsTab from "../tabs/SettingsTab.jsx";
import { useAuth } from "../auth/AuthContext";
import { ROLES, normalizeRole } from "../auth/roleAccess";

export { api };

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "staff", label: "Staff", Component: StaffTab },
  { id: "roster", label: "Rostering", Component: RosterTab },
  { id: "stations", label: "Stations", Component: StationsTab },
  { id: "clocking", label: "Clocking", Component: ClockingTab },
  {
    id: "registrations",
    label: "ID Registration",
    Component: RegistrationsTab,
  },
  { id: "reports", label: "Reports", Component: ReportsTab },
  { id: "exceptions", label: "Exception Reports", Component: ExceptionsTab },
  { id: "settings", label: "Settings", Component: SettingsTab },
];

const ROLE_LABELS = {
  [ROLES.OFFICE_ADMIN]: "Office Admin",
  [ROLES.MANAGER]: "Manager / Supervisor",
  [ROLES.ROSTER_ADMIN]: "Roster Admin",
  [ROLES.WORKER]: "Worker",
};

const ADMIN_TAB_IDS_BY_ROLE = {
  [ROLES.OFFICE_ADMIN]: [
    "staff",
    "roster",
    "stations",
    "clocking",
    "registrations",
    "reports",
    "exceptions",
    "settings",
  ],
  [ROLES.MANAGER]: ["stations", "clocking", "reports", "exceptions"],
  [ROLES.ROSTER_ADMIN]: ["roster"],
  [ROLES.WORKER]: [],
};

// ─── Root App ─────────────────────────────────────────────────────────────────
function AdminApp() {
  const navigate = useNavigate();
  const { logout, currentRole, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("staff");
  const { toast, showToast } = useToast();

  const resolvedRole =
    normalizeRole(currentRole || currentUser?.role) || ROLES.WORKER;
  const roleLabel = ROLE_LABELS[resolvedRole] || ROLE_LABELS[ROLES.WORKER];
  void currentUser;

  const visibleTabs = useMemo(() => {
    const allowed = new Set(ADMIN_TAB_IDS_BY_ROLE[resolvedRole] || []);
    return TABS.filter((tab) => allowed.has(tab.id));
  }, [resolvedRole]);

  const firstVisibleTabId = visibleTabs[0]?.id ?? null;

  useEffect(() => {
    const hasAccessToActiveTab = visibleTabs.some(
      (tab) => tab.id === activeTab,
    );
    if (!hasAccessToActiveTab && firstVisibleTabId) {
      setActiveTab(firstVisibleTabId);
    }
  }, [activeTab, firstVisibleTabId, visibleTabs]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const ActiveComponent = visibleTabs.find(
    (t) => t.id === activeTab,
  )?.Component;

  return (
    <Box>
      <Box
        sx={{
          position: "fixed",
          inset: "-20% 0 0 0",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 20% 20%, rgba(210, 106, 45, 0.2), transparent 50%), radial-gradient(circle at 80% 10%, rgba(46, 111, 95, 0.2), transparent 55%), radial-gradient(circle at 40% 80%, rgba(173, 107, 190, 0.15), transparent 60%)",
        }}
      />

      <AdminTopbar />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 2, md: 5 },
          pt: 0,
          pb: 4,
          mt: 3,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "1400px", mx: "auto" }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <AdminSidebar
                tabs={visibleTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 9.5 }}>
              {ActiveComponent ? (
                <ActiveComponent showToast={showToast} />
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  {roleLabel} has no Admin Portal navigation items in UI mode.
                </Alert>
              )}
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Toast toast={toast} />
    </Box>
  );
}

export default function Admin() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminApp />
    </QueryClientProvider>
  );
}
