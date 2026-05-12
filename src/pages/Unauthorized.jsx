import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getDefaultPathForRole } from "../auth/roleAccess";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { currentRole } = useAuth();

  const handleGoBack = () => {
    navigate(getDefaultPathForRole(currentRole), { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f7f3ec",
        display: "grid",
        placeItems: "center",
        px: 2,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 460,
          p: 4,
          borderRadius: 2,
          textAlign: "center",
          boxShadow: "none",
        }}
      >
        <Stack spacing={2}>
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
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#9b3440",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#852d37",
                boxShadow: "none",
              },
            }}
          >
            Go to my allowed area
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}