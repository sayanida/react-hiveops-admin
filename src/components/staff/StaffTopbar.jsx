/*
StaffTopbar.jsx
	Top bar for staff pages
	•	Displays brand badge, title, and subtitle
	•	Includes ApiConfigBar (inputId set to staffApiBase)
	•	Depends on MUI AppBar/Toolbar and theme
*/

import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import ApiConfigBar from "../common/ApiConfigBar.jsx";
import {
  getRoleLabel,
  getUiCurrentUserName,
  getUiCurrentRole,
} from "../../access/uiRoleNavigation.js";

export default function StaffTopbar({
  apiBase,
  setApiBase,
  showToast,
  showUserIdentity = true,
}) {
  const currentRole = getUiCurrentRole();
  const roleLabel = getRoleLabel(currentRole);
  const currentUserName = getUiCurrentUserName();

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
            py: 2,
            px: { xs: 2, md: 5 },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "1400px",
              mx: "auto",
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
                  width: 46,
                  height: 46,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  color: "common.white",
                  bgcolor: "primary.main",
                }}
              >
                FS
              </Box>
              <Box>
                <Typography variant="h6">Farm Staff</Typography>
                <Typography variant="body2" color="text.secondary">
                  Field-ready time capture & roster access
                </Typography>
              </Box>
            </Box>

            {showUserIdentity && (
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
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.1,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{ fontSize: 14, fontWeight: 600 }}
                  >
                    {currentUserName}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{ fontSize: 9, color: "text.secondary", opacity: 0.85 }}
                  >
                    {`${roleLabel} (${currentRole})`}
                  </Typography>
                </Box>
              </Button>
            )}
          </Box>
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
          storageKey="farm_staff_api_base"
          apiBase={apiBase}
          setApiBase={setApiBase}
          showToast={showToast}
          inputId="staffApiBase"
        />
      </Box>
    </>
  );
}
