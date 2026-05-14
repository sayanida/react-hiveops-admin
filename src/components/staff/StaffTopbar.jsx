/*
StaffTopbar.jsx
	Top bar for staff pages
	•	Displays brand badge, title, and subtitle
	•	Displays worker identity on the right
	•	Moves ApiConfigBar to the bottom-right for testing
*/

import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import ApiConfigBar from "../common/ApiConfigBar.jsx";

export default function StaffTopbar({
  apiBase,
  setApiBase,
  showToast,
  showUserIdentity = true,
}) {
  return (
    <>
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
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                  Beerenberg Time Management System
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Worker Dashboard
                </Typography>
              </Box>
            </Box>

            {showUserIdentity ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  border: "1px solid #9b3440",
                  borderRadius: 1,
                  px: 1.4,
                  py: 0.6,
                  minWidth: 150,
                  color: "common.white",
                }}
              >
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  sx={{
                    width: 22,
                    height: 22,
                    color: "#9b3440",
                    flexShrink: 0,
                  }}
                >
                  <path
                    fill="currentColor"
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#9b3440",
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    Frodo Baggins
                  </Typography>

                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: 10.5,
                      lineHeight: 1.2,
                    }}
                  >
                    Worker
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          position: "fixed",
          right: 24,
          bottom: 16,
          zIndex: 30,
        }}
      >
        <ApiConfigBar
          storageKey="farm_staff_api_base"
          apiBase={apiBase}
          setApiBase={setApiBase}
          showToast={showToast}
          inputId="staffApiBase"
        />
      </Box>
    </>
  );
}