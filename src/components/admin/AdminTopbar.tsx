/*  
•	AdminTopbar.tsx
  Renders the top navigation bar of the admin interface.
	•	Displays brand logo, title, and subtitle
  •	Displays current signed-in user identity
*/

import { useState } from "react";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../../auth/AuthContext";
import ApiConfigBar from "../common/ApiConfigBar";

interface AdminTopbarProps {
  showToast: (msg: string, isError?: boolean) => void;
}

function formatRoleLabel(role: string | undefined | null): string {
  switch (role) {
    case "OFFICE_ADMIN":
      return "Office Admin";
    case "ROSTER_ADMIN":
      return "Roster Admin";
    case "MANAGER":
      return "Manager / Supervisor";
    case "WORKER":
      return "Worker";
    default:
      return "System User";
  }
}

export default function AdminTopbar({
  showToast,
}: AdminTopbarProps): JSX.Element {
  const { currentUser, currentRole } = useAuth();
  const [apiBase, setApiBase] = useState(
    () => localStorage.getItem("timeclock_api_base") || "",
  );

  const userName = currentUser?.name || "Admin User";
  const userRole = formatRoleLabel(currentRole || currentUser?.role);

  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: "blur(18px)",
          backgroundColor: "rgba(244, 248, 252, 0.72)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar
          sx={{
            width: "100%",
            maxWidth: 1400,
            mx: "auto",
            px: { xs: 2, md: 5 },
            py: 1.75,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                display: "grid",
                placeItems: "center",
                color: "common.white",
                borderRadius: 3.5,
                background:
                  "linear-gradient(135deg, rgba(10, 53, 89, 1) 0%, rgba(15, 76, 129, 1) 45%, rgba(53, 127, 182, 1) 100%)",
                boxShadow: "0 14px 34px rgba(10, 53, 89, 0.26)",
              }}
            >
              <Typography
                fontSize="14px"
                fontWeight={700}
                letterSpacing="0.08em"
              >
                BWO
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                Beerenberg Workforce Ops Console
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25 }}
              >
                Admin Dashboard
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PersonIcon />}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 50,
                borderColor: "rgba(15, 76, 129, 0.14)",
                color: "text.primary",
                backgroundColor: "rgba(255,255,255,0.72)",
                px: 1.75,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.1,
                  textAlign: "left",
                }}
              >
                <Typography
                  component="span"
                  sx={{ fontSize: 14, fontWeight: 700 }}
                >
                  {userName}
                </Typography>

                <Typography
                  component="span"
                  sx={{ fontSize: 10, color: "text.secondary", opacity: 0.9 }}
                >
                  {userRole}
                </Typography>
              </Box>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          position: "fixed",
          right: { xs: 16, md: 24 },
          bottom: { xs: 12, md: 16 },
          zIndex: 30,
          backgroundColor: "rgba(255,255,255,0.88)",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 1.25,
          boxShadow: "0 20px 40px rgba(10, 38, 67, 0.12)",
          backdropFilter: "blur(18px)",
        }}
      >
        <ApiConfigBar
          storageKey="timeclock_api_base"
          apiBase={apiBase}
          setApiBase={setApiBase}
          showToast={showToast}
          inputId="adminApiBase"
        />
      </Box>
    </>
  );
}
