/*
AdminSidebar.tsx
  Renders the sidebar (left navigation) of the admin interface.
  • Displays a list of tabs as buttons
  • Highlights the active tab and calls a function when the tab changes
  • Props: array of tabs, current active tab ID, tab switch function
*/

import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";

interface SidebarTab {
  id: string;
  label: string;
}

interface AdminSidebarProps {
  tabs: SidebarTab[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onLogout: () => void;
}

export default function AdminSidebar({
  tabs,
  activeTab,
  setActiveTab,
  onLogout,
}: AdminSidebarProps): JSX.Element {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        position: { md: "sticky" },
        top: { md: 108 },
        background:
          "linear-gradient(180deg, rgba(251, 253, 255, 0.94) 0%, rgba(244, 249, 253, 0.98) 100%)",
        boxShadow: "0 20px 45px rgba(10, 38, 67, 0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      <Stack spacing={1.25} sx={{ minHeight: "100%" }}>
        <Box sx={{ px: 1, pb: 0.5 }}>
          <Typography variant="overline" color="text.secondary">
            Navigation
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.25 }}>
            Admin Console
          </Typography>
        </Box>

        {tabs.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 1, py: 1 }}
          >
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
                px: 1.5,
                py: 1.2,
                borderRadius: 1.5,
                color: isActive ? "primary.contrastText" : "text.primary",
                bgcolor: isActive ? "primary.main" : "transparent",
                border: isActive ? "1px solid transparent" : "1px solid",
                borderColor: isActive
                  ? "transparent"
                  : "rgba(15, 76, 129, 0.08)",
                boxShadow: isActive
                  ? "0 16px 32px rgba(15, 76, 129, 0.24)"
                  : "none",
                "&:hover": {
                  bgcolor: isActive
                    ? "primary.dark"
                    : "rgba(15, 76, 129, 0.05)",
                },
              }}
            >
              {t.label}
            </Button>
          );
        })}

        <Divider sx={{ my: 0.5, mt: "auto" }} />
        <Button
          variant="outlined"
          color="inherit"
          onClick={onLogout}
          sx={{
            color: "primary.main",
            justifyContent: "flex-start",
            textAlign: "left",
            px: 1.5,
            py: 1.2,
            borderRadius: 1.5,
          }}
        >
          Logout
        </Button>
      </Stack>
    </Paper>
  );
}
