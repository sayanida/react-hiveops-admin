import { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

function extractApiMessage(payload: unknown): string {
  if (!payload) return "";
  if (typeof payload === "string") return payload;

  if (typeof payload === "object") {
    const firstValue = Object.values(payload).find(
      (value) => typeof value === "string" && value.trim(),
    );
    return firstValue ? String(firstValue) : "";
  }

  return "";
}

interface LoginForm {
  email: string;
  password: string;
}

export default function Login(): JSX.Element {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
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
    } catch (err: unknown) {
      const status = (err as any).response?.status;
      const apiMessage = extractApiMessage((err as any).response?.data);

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
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "fixed",
          inset: "-12% 0 0 0",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 8% 12%, rgba(15, 76, 129, 0.2), transparent 0, transparent 30%), radial-gradient(circle at 88% 8%, rgba(65, 130, 180, 0.22), transparent 0, transparent 24%), radial-gradient(circle at 48% 82%, rgba(196, 220, 239, 0.36), transparent 0, transparent 30%)",
        }}
      />

      <Box
        sx={{
          position: "fixed",
          right: "-6%",
          top: "18%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.4)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: "blur(18px)",
          backgroundColor: "rgba(244, 248, 252, 0.7)",
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
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, rgba(10, 53, 89, 1) 0%, rgba(15, 76, 129, 1) 45%, rgba(53, 127, 182, 1) 100%)",
                boxShadow: "0 14px 34px rgba(10, 53, 89, 0.2)",
              }}
            >
              BWO
            </Box>

            <Box>
              <Typography variant="h6">
                Beerenberg Workforce Ops Console
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secure sign-in
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
          alignItems: "center",
          px: { xs: 2, md: 4 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1180,
            mx: "auto",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.1fr) minmax(420px, 480px)",
            },
            gap: { xs: 3, lg: 5 },
            alignItems: "center",
          }}
        >
          <Box sx={{ pr: { lg: 3 } }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.72)",
                borderColor: "rgba(15, 76, 129, 0.14)",
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="overline" color="primary.main">
                    Trusted Administrative Access
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 0.5, mt: 0.35 }}
                  >
                    System Purpose
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.65 }}
                  >
                    A secure, centralized, and audit-ready workforce platform
                    for time, attendance, scheduling, and farm operations
                    administration.
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Workspace Focus
                  </Typography>
                  <List dense disablePadding sx={{ px: 0.5 }}>
                    <ListItem disablePadding sx={{ py: 0.2 }}>
                      <ListItemText
                        primary="Workforce scheduling and rostering"
                        primaryTypographyProps={{
                          variant: "body2",
                          color: "text.secondary",
                        }}
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.2 }}>
                      <ListItemText
                        primary="Time and attendance management"
                        primaryTypographyProps={{
                          variant: "body2",
                          color: "text.secondary",
                        }}
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.2 }}>
                      <ListItemText
                        primary="Compliance and exception monitoring"
                        primaryTypographyProps={{
                          variant: "body2",
                          color: "text.secondary",
                        }}
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.2 }}>
                      <ListItemText
                        primary="Payroll-supporting reporting"
                        primaryTypographyProps={{
                          variant: "body2",
                          color: "text.secondary",
                        }}
                      />
                    </ListItem>
                  </List>
                </Box>

                <Divider />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      flex: 1,
                      bgcolor: "rgba(251, 254, 255, 0.9)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 0.5 }}
                    >
                      Access Model
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      RBAC keeps each user focused on the functions aligned to
                      their operational responsibilities.
                    </Typography>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      flex: 1,
                      bgcolor: "rgba(251, 254, 255, 0.9)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 0.5 }}
                    >
                      Audit & Compliance
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Key administrative actions are logged for traceability,
                      transparency, and workforce compliance.
                    </Typography>
                  </Paper>
                </Stack>

                <Box
                  sx={{
                    p: 1.4,
                    borderRadius: 1.25,
                    backgroundColor: "rgba(15, 76, 129, 0.06)",
                    border: "1px dashed rgba(15, 76, 129, 0.26)",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Operations Note
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    The platform is configured for operational integrity first:
                    clear responsibility boundaries, auditable actions, and
                    consistent reporting outputs.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              width: "100%",
              borderRadius: 2,
              overflow: "hidden",
              borderColor: "rgba(15, 76, 129, 0.12)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248, 251, 254, 0.98) 100%)",
              boxShadow: "0 30px 60px rgba(10, 38, 67, 0.12)",
            }}
          >
            <Box
              sx={{
                background:
                  "linear-gradient(135deg, rgba(8, 48, 84, 0.98) 0%, rgba(18, 88, 143, 0.96) 52%, rgba(108, 171, 214, 0.92) 100%)",
                color: "common.white",
                px: 3,
                py: 2.5,
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 0.5 }}>
                Admin Login
              </Typography>
              <Typography
                sx={{ color: "rgba(247, 251, 255, 0.8)", fontSize: 13 }}
              >
                Use your assigned credentials to continue.
              </Typography>
            </Box>

            <Box sx={{ px: 3, py: 3.25 }}>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  {error ? <Alert severity="error">{error}</Alert> : null}

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "text.secondary",
                        mb: 0.8,
                        fontWeight: 600,
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
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "rgba(255,255,255,0.86)",
                          borderRadius: 1.5,
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "text.secondary",
                        mb: 0.8,
                        fontWeight: 600,
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
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "rgba(255,255,255,0.86)",
                          borderRadius: 1.5,
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
                      py: 1.3,
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {submitting ? "Logging in..." : "Log In"}
                  </Button>

                  <Typography
                    sx={{ fontSize: 12, color: "text.secondary", pt: 1 }}
                  >
                    Forgot password? Contact your system administrator.
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
