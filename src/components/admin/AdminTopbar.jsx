/*  
•	AdminTopbar.jsx
  Renders the top navigation bar of the admin interface.
	•	Displays brand logo, title, and subtitle
	•	Includes ApiConfigBar for viewing and editing the API base URL
	•	Props: API URL, update function, toast notification function, input ID
*/

import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import ApiConfigBar from "../common/ApiConfigBar.jsx";

export default function AdminTopbar({ apiBase, setApiBase, showToast }) {
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
              fontWeight: 700,
              color: "common.white",
              bgcolor: "secondary.main",
            }}
          >
            TC
          </Box>
          <Box>
            <Typography variant="h6">Timeclock Admin</Typography>
            <Typography variant="body2" color="text.secondary">
              Roster, clocking, pay, and compliance
            </Typography>
          </Box>
        </Box>

        <ApiConfigBar
          storageKey="timeclock_api_base"
          apiBase={apiBase}
          setApiBase={setApiBase}
          showToast={showToast}
          inputId="adminApiBase"
        />
      </Toolbar>
    </AppBar>
  );
}
