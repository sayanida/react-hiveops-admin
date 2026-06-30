/*
Admin.tsx
  Entry page for the admin dashboard
  • Wraps child components (AdminTopbar, AdminSidebar, tab components) with QueryClientProvider
  • Manages tab switching and toast notifications
  • Contains AdminApp (state management) and TABS (tab settings)
  • Exports adminApi for API calls
*/

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert, Box, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useToast from "../hooks/useToast";
import Toast from "../components/common/Toast";
import AdminTopbar from "../components/admin/AdminTopbar";
import AdminSidebar from "../components/admin/AdminSidebar";
import { adminApi as api } from "../utils/api";

import StaffTab from "../tabs/StaffTab";
import RosterTab from "../tabs/RosterTab";
import StationsTab from "../tabs/StationsTab";
import ClockingTab from "../tabs/ClockingTab";
import RegistrationsTab from "../tabs/RegistrationsTab";
import ReportsTab from "../tabs/ReportsTab";
import ExceptionsTab from "../tabs/ExceptionsTab";
import BreakAlertsTab from "../tabs/BreakAlertsTab";
import SettingsTab from "../tabs/SettingsTab";
import { useAuth } from "../auth/AuthContext";
import { ROLES, normalizeRole } from "../auth/roleAccess";

export { api };

const WORKER_ROLE = "WORKER";

type ShowToast = (msg: string, isError?: boolean) => void;

interface AdminTabConfig {
  id: string;
  label: string;
  Component: ComponentType<{ showToast: ShowToast }>;
}

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS: AdminTabConfig[] = [
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
  { id: "break-alerts", label: "Break Alerts", Component: BreakAlertsTab },
  { id: "exceptions", label: "Exception Reports", Component: ExceptionsTab },
  { id: "settings", label: "Settings", Component: SettingsTab },
];

const ROLE_LABELS: Record<string, string> = {
  [ROLES.OFFICE_ADMIN]: "Office Admin",
  [ROLES.MANAGER]: "Manager / Supervisor",
  [ROLES.ROSTER_ADMIN]: "Roster Admin",
  [WORKER_ROLE]: "Worker",
};

const ADMIN_TAB_IDS_BY_ROLE: Record<string, string[]> = {
  [ROLES.OFFICE_ADMIN]: [
    "staff",
    "roster",
    "stations",
    "clocking",
    "registrations",
    "reports",
    "break-alerts",
    "exceptions",
    "settings",
  ],
  [ROLES.MANAGER]: [
    "stations",
    "clocking",
    "reports",
    "break-alerts",
    "exceptions",
  ],
  [ROLES.ROSTER_ADMIN]: ["roster"],
  [WORKER_ROLE]: [],
};

// ─── Root App ─────────────────────────────────────────────────────────────────
function AdminApp(): JSX.Element {
  const navigate = useNavigate();
  const { logout, currentRole, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("staff");
  const { toast, showToast } = useToast();

  const resolvedRole =
    normalizeRole(currentRole || currentUser?.role) || WORKER_ROLE;
  const roleLabel = ROLE_LABELS[resolvedRole] || ROLE_LABELS[WORKER_ROLE];
  void currentUser;

  const visibleTabs = useMemo<AdminTabConfig[]>(() => {
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

  const handleLogout = (): void => {
    logout();
    navigate("/login", { replace: true });
  };

  const ActiveComponent = visibleTabs.find(
    (t) => t.id === activeTab,
  )?.Component;

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "fixed",
          inset: "-12% 0 0 0",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 12% 12%, rgba(15, 76, 129, 0.18), transparent 0, transparent 34%), radial-gradient(circle at 85% 4%, rgba(68, 132, 181, 0.18), transparent 0, transparent 24%), radial-gradient(circle at 52% 78%, rgba(176, 207, 232, 0.36), transparent 0, transparent 28%)",
        }}
      />

      <Box
        sx={{
          position: "fixed",
          inset: "auto auto 14% -10%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.45)",
          filter: "blur(24px)",
          pointerEvents: "none",
        }}
      />

      <AdminTopbar showToast={showToast} />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 2, md: 4, lg: 5 },
          pt: 0,
          pb: 5,
          mt: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "1440px", mx: "auto" }}>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 3, lg: 2.7 }}>
              <AdminSidebar
                tabs={visibleTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 9, lg: 9.3 }}>
              {ActiveComponent ? (
                <Box sx={{ display: "grid", gap: 2.5 }}>
                  <ActiveComponent showToast={showToast} />
                </Box>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 4 }}>
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

export default function Admin(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminApp />
    </QueryClientProvider>
  );
}
