import { Button, Paper, Stack } from "@mui/material";

export default function AdminSidebar({ tabs, activeTab, setActiveTab }) {
  return (
    <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
      <Stack spacing={1}>
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <Button
              key={t.id}
              variant={isActive ? "contained" : "text"}
              color={isActive ? "primary" : "inherit"}
              onClick={() => setActiveTab(t.id)}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
            >
              {t.label}
            </Button>
          );
        })}
      </Stack>
    </Paper>
  );
}
