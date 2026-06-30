/*
Staff.jsx
	Entry page for the staff dashboard
	•	Wraps StaffTopbar and StaffDashboard with QueryClientProvider
  •	Manages staff session state and toast notifications
	•	Contains StaffApp for state management

  Difference from Admin.jsx:
  •	Staff-specific theme and display
	
  Note: QueryClient settings affect dashboard behavior due to multiple API calls and UI interactions
*/

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Box } from "@mui/material";
import useToast from "../hooks/useToast";
import Toast from "../components/common/Toast";
import StaffTopbar from "../components/staff/StaffTopbar";
import StaffDashboard from "../components/staff/StaffDashboard";

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
function StaffApp() {
  const [isStaffSessionActive, setIsStaffSessionActive] = useState(false);
  const { toast, showToast } = useToast();

  return (
    <Box>
      <Box
        sx={{
          position: "fixed",
          inset: "-10% 0 0 0",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 20% 20%, rgba(210, 106, 45, 0.2), transparent 50%), radial-gradient(circle at 80% 10%, rgba(46, 111, 95, 0.2), transparent 55%), radial-gradient(circle at 40% 80%, rgba(173, 107, 190, 0.15), transparent 60%)",
        }}
      />

      <StaffTopbar
        showUserIdentity={isStaffSessionActive}
        showToast={showToast}
      />

      <StaffDashboard
        showToast={showToast}
        onSessionStart={() => setIsStaffSessionActive(true)}
        onSessionEnd={() => setIsStaffSessionActive(false)}
      />

      <Toast toast={toast} />
    </Box>
  );
}

export default function Staff() {
  return (
    <QueryClientProvider client={queryClient}>
      <StaffApp />
    </QueryClientProvider>
  );
}
