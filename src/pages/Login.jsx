import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

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
      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f7f3ec",
      }}
    >
      {/* Top-left system header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: "1px solid",
          borderColor: "#d9d0c7",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            display: "grid",
            placeItems: "center",
            bgcolor: "#9b3440",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          BTMS
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#252525" }}>
            Beerenberg Time Management System
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#7b746d" }}>
            Admin Dashboard
          </Typography>
        </Box>
      </Box>

      {/* Login card */}
      <Box
        sx={{
          minHeight: "calc(100vh - 84px)",
          display: "grid",
          placeItems: "center",
          px: 2,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            maxWidth: 445,
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
              py: 1.8,
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
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#6f6860",
                      mb: 0.8,
                    }}
                  >
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
                    InputLabelProps={{ shrink: false }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#fffdf9",
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#6f6860",
                      mb: 0.8,
                    }}
                  >
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
                    InputLabelProps={{ shrink: false }}
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

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#8a837b",
                    pt: 1,
                  }}
                >
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