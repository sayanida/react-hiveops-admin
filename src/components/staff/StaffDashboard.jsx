import { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { PanelCard, PrimaryButton, GhostButton } from "../../tabs/shared.jsx";

const STATION_NAME = "North Shed";
const DEVICE_ID = "DEVICE-001";

const IDENTIFICATION_METHODS = [
  { value: "face", label: "Face ID" },
  { value: "card", label: "Card" },
  { value: "retinal", label: "Retinal Scan" },
  { value: "fingerprint", label: "Fingerprint" },
];

const MOCK_WORKER = {
  id: "EMP-001",
  name: "Frodo Baggins",
  role: "Worker",
  initials: "FB",
};

function KioskActionButton({ children, sx = {}, ...props }) {
  return (
    <PrimaryButton
      fullWidth
      {...props}
      sx={{
        py: 1.2,
        borderRadius: 1.5,
        textTransform: "none",
        fontWeight: 600,
        boxShadow: "none",
        ...sx,
      }}
    >
      {children}
    </PrimaryButton>
  );
}

function IdleState({ selectedMethod, setSelectedMethod, onIdentify }) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 180px)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <PanelCard>
        <Box
          sx={{
            width: "100%",
            maxWidth: 560,
            px: { xs: 1, sm: 2, md: 4 },
            py: { xs: 1, sm: 2 },
            textAlign: "center",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#9b3440",
              mb: 1,
              fontSize: { xs: "2rem", md: "2.6rem" },
            }}
          >
            Welcome
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontWeight: 400, mb: 3 }}
          >
            Beerenberg Family Farm Time Management System
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 1.5, textAlign: "left" }}
          >
            Identification Step
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "left", mb: 2.5 }}
          >
            Select the identification method available at this station.
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ mb: 2.5, justifyContent: "flex-start" }}
          >
            {IDENTIFICATION_METHODS.map((method) => (
              <Chip
                key={method.value}
                label={method.label}
                clickable
                color={selectedMethod === method.value ? "secondary" : "default"}
                variant={selectedMethod === method.value ? "filled" : "outlined"}
                onClick={() => setSelectedMethod(method.value)}
                sx={{ fontWeight: 500 }}
              />
            ))}
          </Stack>

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel id="identification-method-label">
              Identification Method
            </InputLabel>
            <Select
              labelId="identification-method-label"
              value={selectedMethod}
              label="Identification Method"
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              {IDENTIFICATION_METHODS.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <PrimaryButton
            fullWidth
            onClick={onIdentify}
            sx={{
              py: 1.3,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 1.5,
            }}
          >
            Continue
          </PrimaryButton>

          <Typography
            variant="body2"
            sx={{ mt: 4, color: "#9b3440", fontWeight: 700 }}
          >
            Clock Station: {STATION_NAME}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Device: {DEVICE_ID}
          </Typography>
        </Box>
      </PanelCard>
    </Box>
  );
}

function IdentifiedState({
  selectedReason,
  setSelectedReason,
  activePanel,
  onAction,
  onEndSession,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "300px 1fr" },
        gap: 2.5,
        alignItems: "stretch",
      }}
    >
      <PanelCard>
        <Stack spacing={2}>
          <Box sx={{ textAlign: "center" }}>
            <Avatar
              sx={{
                width: 88,
                height: 88,
                mx: "auto",
                mb: 1.5,
                bgcolor: "#d8c8b4",
                color: "#5d4b3a",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {MOCK_WORKER.initials}
            </Avatar>

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {MOCK_WORKER.name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {MOCK_WORKER.id} · {MOCK_WORKER.role}
            </Typography>

            <Typography
              variant="body2"
              sx={{ mt: 1, color: "#9b3440", fontWeight: 700 }}
            >
              Clock Station: {STATION_NAME}
            </Typography>
          </Box>

          <Divider />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 1,
            }}
          >
            <KioskActionButton
              onClick={() => onAction("clock-in")}
              sx={{
                backgroundColor: "#e1a23b",
                color: "#ffffff",
                "&:hover": { backgroundColor: "#cf922e" },
              }}
            >
              Clock In
            </KioskActionButton>

            <KioskActionButton
              onClick={() => onAction("clock-out")}
              sx={{
                backgroundColor: "#f0c66c",
                color: "#4f3a23",
                "&:hover": { backgroundColor: "#dfb85f" },
              }}
            >
              Clock Out
            </KioskActionButton>

            <KioskActionButton
              onClick={() => onAction("start-break")}
              sx={{
                backgroundColor: "#2f8a3d",
                color: "#ffffff",
                "&:hover": { backgroundColor: "#277434" },
              }}
            >
              Start Break
            </KioskActionButton>

            <KioskActionButton
              onClick={() => onAction("end-break")}
              sx={{
                backgroundColor: "#a3d7a7",
                color: "#315f35",
                "&:hover": { backgroundColor: "#91cb95" },
              }}
            >
              End Break
            </KioskActionButton>
          </Box>

          <FormControl fullWidth size="small">
            <InputLabel id="break-reason-select-label">Break Reason</InputLabel>
            <Select
              labelId="break-reason-select-label"
              value={selectedReason}
              label="Break Reason"
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              <MenuItem value="meal">Meal</MenuItem>
              <MenuItem value="hydration">Hydration</MenuItem>
              <MenuItem value="equipment">Equipment Issue</MenuItem>
              <MenuItem value="weather">Weather Delay</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <KioskActionButton
            onClick={() => onAction("roster")}
            sx={{
              backgroundColor: "#8F343D",
              color: "#ffffff",
              "&:hover": { backgroundColor: "#852d37" },
            }}
          >
            View Today&apos;s Roster
          </KioskActionButton>

          <KioskActionButton
            onClick={() => onAction("supervisor-override")}
            sx={{
              backgroundColor: "#d9d4cd",
              color: "#585047",
              "&:hover": { backgroundColor: "#cbc5bd" },
            }}
          >
            Supervisor Override
          </KioskActionButton>

          <Divider />

          <GhostButton
            fullWidth
            onClick={onEndSession}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Done — End Session
          </GhostButton>
        </Stack>
      </PanelCard>

      <PanelCard>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#d9edd6",
            mb: 2.5,
          }}
        >
          <Typography variant="h5" sx={{ color: "#2f7a39", fontWeight: 700 }}>
            Welcome back, {MOCK_WORKER.name}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {MOCK_WORKER.id} · {MOCK_WORKER.role} · {STATION_NAME}
          </Typography>
        </Box>

        {!activePanel ? (
          <Box
            sx={{
              minHeight: 260,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Select an action
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kiosk content will appear here after the worker chooses an option.
              </Typography>
            </Box>
          </Box>
        ) : activePanel === "roster" ? (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              My Roster Today
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Roster details will be added here in Task 119.
            </Typography>
          </Box>
        ) : activePanel === "supervisor-override" ? (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Supervisor Override
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Placeholder panel for Task 120 layout.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {activePanel
                .split("-")
                .map((word) => word[0].toUpperCase() + word.slice(1))
                .join(" ")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Placeholder panel for Task 120 layout.
            </Typography>
          </Box>
        )}
      </PanelCard>
    </Box>
  );
}

export default function StaffDashboard({ showToast }) {
  const [screen, setScreen] = useState("idle");
  const [selectedMethod, setSelectedMethod] = useState("face");
  const [selectedReason, setSelectedReason] = useState("");
  const [activePanel, setActivePanel] = useState("");

  const handleIdentify = () => {
    setScreen("identified");
    setActivePanel("");
    showToast?.("Mock identification successful.");
  };

  const handleEndSession = () => {
    setScreen("idle");
    setSelectedReason("");
    setActivePanel("");
    showToast?.("Session ended.");
  };

  const handleAction = (panel) => {
    setActivePanel(panel);
  };

  return (
    <Box sx={{ position: "relative", zIndex: 1, px: { xs: 2, md: 5 }, py: 4 }}>
      {screen === "idle" ? (
        <IdleState
          selectedMethod={selectedMethod}
          setSelectedMethod={setSelectedMethod}
          onIdentify={handleIdentify}
        />
      ) : (
        <IdentifiedState
          selectedReason={selectedReason}
          setSelectedReason={setSelectedReason}
          activePanel={activePanel}
          onAction={handleAction}
          onEndSession={handleEndSession}
        />
      )}
    </Box>
  );
}