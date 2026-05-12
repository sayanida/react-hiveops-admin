/*
StaffTopbar.jsx
	Top bar for staff pages
	•	Displays brand badge, title, and subtitle
	•	Includes ApiConfigBar (inputId set to staffApiBase)
	•	Depends on MUI AppBar/Toolbar and theme
*/

import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import ApiConfigBar from "../common/ApiConfigBar.jsx";

export default function StaffTopbar({ apiBase, setApiBase, showToast }) {
  return (
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
              BTMS
            </Box>

            <Box>
              <Typography variant="h6">Beerenberg Time Management System</Typography>
              <Typography variant="body2" color="text.secondary">
                Worker Dashboard
              </Typography>
            </Box>
          </Box>

          <ApiConfigBar
            storageKey="farm_staff_api_base"
            apiBase={apiBase}
            setApiBase={setApiBase}
            showToast={showToast}
            inputId="staffApiBase"
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}