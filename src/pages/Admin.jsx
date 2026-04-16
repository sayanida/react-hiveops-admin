/*
Admin.jsx
	Entry page for the admin dashboard
	•	Wraps child components (AdminTopbar, AdminSidebar, tab components) with QueryClientProvider
	•	Manages tab switching, API base URL, and toast notifications
	•	Contains AdminApp (state management) and TABS (tab settings)
	•	Exports adminApi for API calls
*/

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Box, Grid } from "@mui/material";
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
    label: "Cards & Biometrics",
    Component: RegistrationsTab,
  },
  { id: "reports", label: "Reports", Component: ReportsTab },
  { id: "exceptions", label: "Exception Reports", Component: ExceptionsTab },
];

// ─── Root App ─────────────────────────────────────────────────────────────────
function AdminApp() {
  const [activeTab, setActiveTab] = useState("staff");
  const [apiBase, setApiBase] = useState(
    () => localStorage.getItem("timeclock_api_base") || "",
  );
  const { toast, showToast } = useToast();

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component;

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

      <AdminTopbar
        apiBase={apiBase}
        setApiBase={setApiBase}
        showToast={showToast}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          pl: { xs: 2, md: 0 },
          pr: { xs: 2, md: 5 },
          pt: 0,
          pb: 4,
          mt: 3,
        }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 2.5 }}>
            <AdminSidebar
              tabs={TABS}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 9.5 }}>
            {ActiveComponent && <ActiveComponent showToast={showToast} />}
          </Grid>
        </Grid>
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
