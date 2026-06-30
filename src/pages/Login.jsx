import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

function extractApiMessage(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;

  const firstValue = Object.values(payload).find(
    (value) => typeof value === "string" && value.trim(),
  );

  return firstValue ? String(firstValue) : "";
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);

      await login({
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const apiMessage = extractApiMessage(err.response?.data);

      if (status === 401) {
        setError(apiMessage || "Invalid email or password.");
      } else if (status === 404) {
        setError(apiMessage || "Account not found.");
      } else if (status === 409) {
        setError(apiMessage || "Login conflict occurred. Please try again.");
      } else {
        setError(apiMessage || "Login failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f7f3ec" }}>
      <Box
        sx={{
          position: "fixed",
          inset: "-20% 0 0 0",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 20% 20%, rgba(210, 106, 45, 0.2), transparent 50%), radial-gradient(circle at 80% 10%, rgba(46, 111, 95, 0.2), transparent 55%), radial-gradient(circle at 40% 80%, rgba(173, 107, 190, 0.15), transparent 60%)",
        }}
      />

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
              alignItems: "center",
              gap: 2,
            }}
          >
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
              <Typography variant="h6">
                Beerenberg Workforce Ops Console
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admin Dashboard
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "calc(100vh - 82px)",
          display: "grid",
          placeItems: "center",
          px: 2,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            maxWidth: 440,
            borderRadius: 1.5,
            overflow: "hidden",
            borderColor: "#d8cfc5",
            boxShadow: "none",
            backgroundColor: "#fbf8f3",
          }}
        >
          <Box
            sx={{
              bgcolor: "#9b3440",
              color: "#fff",
              px: 2.5,
              py: 1.7,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              Admin Login
            </Typography>
          </Box>

          <Box sx={{ px: 2.5, py: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {error ? <Alert severity="error">{error}</Alert> : null}

                <Box>
                  <Typography sx={{ fontSize: 12, color: "#6f6860", mb: 0.8 }}>
                    Email
                  </Typography>
                  <TextField
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@beerenberg.com.au"
                    fullWidth
                    size="small"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#fffdf9",
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12, color: "#6f6860", mb: 0.8 }}>
                    Password
                  </Typography>
                  <TextField
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    fullWidth
                    size="small"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#fffdf9",
                      },
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  sx={{
                    mt: 0.5,
                    py: 1.2,
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
                  {submitting ? "Logging in..." : "Log In"}
                </Button>

                <Typography sx={{ fontSize: 12, color: "#8a837b", pt: 1 }}>
                  Forgot password? Contact your system administrator.
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
