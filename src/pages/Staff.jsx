/*
Staff.jsx
	Entry page for the staff dashboard
	•	Wraps StaffTopbar and StaffDashboard with QueryClientProvider
	•	Manages API base URL (farm_staff_api_base) and toast notifications
	•	Contains StaffApp for state management
	
  Difference from Admin.jsx:
	•	Staff-specific theme and display
	•	Uses staff API base from localStorage
	
  Note: QueryClient settings affect dashboard behavior due to multiple API calls and UI interactions
*/

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Box } from "@mui/material";
import useToast from "../hooks/useToast.js";
import Toast from "../components/common/Toast.jsx";
import StaffTopbar from "../components/staff/StaffTopbar.jsx";
import StaffDashboard from "../components/staff/StaffDashboard.jsx";

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
function StaffApp() {
  const [apiBase, setApiBase] = useState(
    () => localStorage.getItem("farm_staff_api_base") || "",
  );
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
            "radial-gradient(circle at 15% 20%, rgba(228, 161, 59, 0.25), transparent 55%), radial-gradient(circle at 85% 5%, rgba(47, 107, 74, 0.2), transparent 55%), radial-gradient(circle at 45% 70%, rgba(201, 109, 58, 0.15), transparent 60%)",
        }}
      />

      <StaffTopbar
        apiBase={apiBase}
        setApiBase={setApiBase}
        showToast={showToast}
      />

      <StaffDashboard showToast={showToast} />

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
