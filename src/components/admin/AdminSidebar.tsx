/*
AdminSidebar.tsx
  Renders the sidebar (left navigation) of the admin interface.
  • Displays a list of tabs as buttons
  • Highlights the active tab and calls a function when the tab changes
  • Props: array of tabs, current active tab ID, tab switch function
*/

import { Box, Button, Divider, Stack } from "@mui/material";

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
    <Box sx={{ p: 1, height: "100%" }}>
      <Stack spacing={1.25} sx={{ minHeight: "100%" }}>
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
                  ? "0 2px 8px rgba(15, 76, 129, 0.22)"
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
    </Box>
  );
}
