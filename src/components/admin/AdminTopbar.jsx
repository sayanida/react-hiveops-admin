/*  
•	AdminTopbar.jsx
  Renders the top navigation bar of the admin interface.
	•	Displays brand logo, title, and subtitle
	•	Includes ApiConfigBar for viewing and editing the API base URL
	•	Props: API URL, update function, toast notification function, input ID
*/

import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import ApiConfigBar from "../common/ApiConfigBar.jsx";

export default function AdminTopbar({
  apiBase,
  setApiBase,
  showToast,
  userName = "Admin User",
  userRole = "System Administrator",
}) {
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
                BTMC
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

      <Box
        sx={{
          position: "fixed",
          right: { xs: 12, md: 24 },
          bottom: { xs: 12, md: 24 },
          zIndex: (theme) => theme.zIndex.appBar - 1,
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
          boxShadow: "0 10px 24px rgba(28, 26, 23, 0.15)",
          maxWidth: "calc(100vw - 24px)",
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
