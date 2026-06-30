import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getDefaultPathForRole } from "../auth/roleAccess";

export default function Unauthorized(): JSX.Element {
  const navigate = useNavigate();
  const { currentRole, currentUser } = useAuth();
  const role = currentRole || currentUser?.role;

  const handleGoBack = (): void => {
    navigate(getDefaultPathForRole(role), { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 10% 15%, rgba(15, 76, 129, 0.16), transparent 0, transparent 30%), radial-gradient(circle at 88% 10%, rgba(68, 132, 181, 0.2), transparent 0, transparent 24%), radial-gradient(circle at 50% 80%, rgba(196, 220, 239, 0.3), transparent 0, transparent 30%)",
        }}
      />

      <Paper
        variant="outlined"
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, md: 4 },
          borderRadius: 6,
          textAlign: "center",
          boxShadow: "0 28px 60px rgba(10, 38, 67, 0.12)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248, 251, 254, 0.98) 100%)",
        }}
      >
        <Stack spacing={2.25}>
          <Chip
            label="Access Control"
            sx={{
              alignSelf: "center",
              bgcolor: "rgba(15, 76, 129, 0.08)",
              color: "primary.main",
              fontWeight: 700,
            }}
          />

          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Access denied
          </Typography>

          <Typography color="text.secondary">
            You do not have permission to access this area.
          </Typography>

          <Button
            variant="contained"
            onClick={handleGoBack}
            sx={{
              fontWeight: 700,
              px: 2.25,
              py: 1.1,
              alignSelf: "center",
            }}
          >
            Go to my allowed area
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
