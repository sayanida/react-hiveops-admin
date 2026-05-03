/*	
•	AdminSidebar.jsx
  Renders the sidebar (left navigation) of the admin interface.
	•	Displays a list of tabs as buttons
	•	Highlights the active tab and calls a function when the tab changes
	•	Props: array of tabs, current active tab ID, tab switch function
*/

import { Button, Divider, Paper, Stack, Typography } from "@mui/material";

export default function AdminSidebar({
  tabs,
  activeTab,
  setActiveTab,
  onLogout,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        pl: 5,
        pr: 4,
        height: "100%",
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
        position: "fixed",
      }}
    >
      <Stack spacing={1} sx={{ minHeight: "100%" }}>
        {tabs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            No Admin Portal sections are visible for this role.
          </Typography>
        ) : null}

        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <Button
              key={t.id}
              variant={isActive ? "contained" : "text"}
              color={isActive ? "primary" : "inherit"}
              onClick={() => setActiveTab(t.id)}
              sx={{
                justifyContent: "flex-start",
                textAlign: "left",
                textTransform: "none",
                px: 1,
              }}
            >
              {t.label}
            </Button>
          );
        })}

        <Divider sx={{ my: 0.5, mt: "auto" }} />
        <Button
          variant="text"
          color="inherit"
          onClick={onLogout}
          sx={{
            color: "primary.main",
            justifyContent: "flex-start",
            textAlign: "left",
            textTransform: "none",
            px: 1,
          }}
        >
          Logout
        </Button>
      </Stack>
    </Paper>
  );
}
