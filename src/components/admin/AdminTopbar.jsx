/*  
•	AdminTopbar.jsx
  Renders the top navigation bar of the admin interface.
	•	Displays brand logo, title, and subtitle
  •	Displays current signed-in user identity
*/

import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../../auth/AuthContext";

function formatRoleLabel(role) {
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

export default function AdminTopbar() {
  const { currentUser, currentRole } = useAuth();

  const userName = currentUser?.name || "Admin User";
  const userRole = formatRoleLabel(currentRole || currentUser?.role);

  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: "blur(10px)",
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
            py: 2,
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
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                color: "common.white",
                bgcolor: "primary.main",
              }}
            >
              <Typography fontSize="14px" fontWeight={600}>
                BTMS
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6">
                Beerenberg Time Management System
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admin Dashboard
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<PersonIcon />}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              borderColor: "primary.main",
              color: "primary.main",
              textTransform: "none",
              backgroundColor: "transparent",
            }}
          >
            <Box
              sx={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}
            >
              <Typography
                component="span"
                sx={{ fontSize: 14, fontWeight: 600 }}
              >
                {userName}
              </Typography>

              <Typography
                component="span"
                sx={{ fontSize: 9, color: "text.secondary", opacity: 0.85 }}
              >
                {userRole}
              </Typography>
            </Box>
          </Button>
        </Toolbar>
      </AppBar>
    </>
  );
}
