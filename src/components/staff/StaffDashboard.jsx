import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { PanelCard, PrimaryButton, GhostButton } from "../../tabs/shared.jsx";
import frodoProfile from "../../assets/frodo-baggins.jpg";

// ─── Mock kiosk / worker data ────────────────────────────────────────────────
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

// ─── Task 119 mock roster state ──────────────────────────────────────────────
// Toggle HAS_SHIFT to quickly test both wireframe states while building.
const HAS_SHIFT = true;

const MOCK_TODAY_ROSTER = {
  date: "4 Apr 2026",
  startTime: "07:00 AM",
  duration: "8 hrs",
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

// ─── Small roster info card - Righ Panel ─────────────────────
function RosterInfoCard({ label, value }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        backgroundColor: "#f3efe9",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );
}

// ─── Roster content ─────────────────────────────────────
function TodayRosterPanel({ hasShift, roster }) {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        My Roster Today
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Your confirmed shift for today.
      </Typography>

      {hasShift ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <RosterInfoCard label="Date" value={roster.date} />
          <RosterInfoCard label="Start Time" value={roster.startTime} />
          <RosterInfoCard label="Duration" value={roster.duration} />
        </Box>
      ) : (
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            backgroundColor: "#eef0f3",
            border: "1px solid",
            borderColor: "#c8cdd4",
          }}
        >
          <Typography variant="body1" sx={{ mb: 0.5 }}>
            No shift scheduled for today.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Contact your supervisor if you believe this is an error.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function IdentifiedState({
  selectedReason,
  setSelectedReason,
  activePanel,
  onAction,
  onEndSession,
  hasShift,
  roster,
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
          <TodayRosterPanel hasShift={hasShift} roster={roster} />
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

// ─── Task 123 Face ID PoC dialog ─────────────────────────────────────────────
// Uses the real webcam for capture, then shows a mock match result with Frodo.
function FaceIdPocDialog({
  open,
  onClose,
  onContinue,
  videoRef,
  cameraError,
  capturedPhoto,
  onCapture,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Face ID PoC Capture</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This proof of concept uses the webcam for capture and then shows a
          mock matched profile result.
        </Typography>

        {!capturedPhoto ? (
          <Box>
            {cameraError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {cameraError}
              </Alert>
            ) : null}

            <Box
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: "#111",
                minHeight: 340,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Box
                component="video"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                sx={{
                  width: "100%",
                  maxHeight: 420,
                  objectFit: "cover",
                }}
              />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <PanelCard title="Captured Image">
              <Box
                component="img"
                src={capturedPhoto}
                alt="Captured webcam frame"
                sx={{
                  width: "100%",
                  borderRadius: 1.5,
                  objectFit: "cover",
                }}
              />
            </PanelCard>

            <PanelCard title="Mock Matched Profile">
              <Box
                component="img"
                src={frodoProfile}
                alt="Matched worker profile"
                sx={{
                  width: "100%",
                  borderRadius: 1.5,
                  objectFit: "cover",
                }}
              />

              <Alert severity="success" sx={{ mt: 2 }}>
                PoC mock face match successful. Identified as {MOCK_WORKER.name}.
              </Alert>
            </PanelCard>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <GhostButton onClick={onClose}>Cancel</GhostButton>

        {!capturedPhoto ? (
          <PrimaryButton onClick={onCapture} disabled={Boolean(cameraError)}>
            Capture
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={onContinue}>Continue to Kiosk</PrimaryButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default function StaffDashboard({
  showToast,
  onSessionStart,
  onSessionEnd,
}) {
  const [screen, setScreen] = useState("idle");
  const [selectedMethod, setSelectedMethod] = useState("face");
  const [selectedReason, setSelectedReason] = useState("");
  const [activePanel, setActivePanel] = useState("");

    // ─── Task 123 webcam PoC state ─────────────────────────────────────────────
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleIdentify = () => {
    if (selectedMethod !== "face") {
      showToast?.("Mock identification successful, for Face ID only.", true);
      return;
    }

    setCameraError("");
    setCapturedPhoto("");
    setCameraOpen(true);
  };

  const handleEndSession = () => {
    setScreen("idle");
    setSelectedReason("");
    setActivePanel("");
    onSessionEnd?.();
    showToast?.("Session ended.");
  };

  const handleAction = (panel) => {
    setActivePanel(panel);
  };

    // ─── Webcam helpers ────────────────────────────────────────────────────────
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  useEffect(() => {
    if (!cameraOpen || capturedPhoto) return;

    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraError("");
      } catch (err) {
        setCameraError("Unable to access webcam. Please allow camera access.");
        showToast?.("Unable to access webcam.", true);
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraOpen, capturedPhoto, showToast]);

  function handleCloseCameraDialog() {
    stopCamera();
    setCameraOpen(false);
    setCameraError("");
    setCapturedPhoto("");
  }

  function handleCapturePhoto() {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoData = canvas.toDataURL("image/png");

    setCapturedPhoto(photoData);
    stopCamera();
  }

  function handleContinueToKiosk() {
    setCameraOpen(false);
    setScreen("identified");
    setActivePanel("");
    onSessionStart?.();
    showToast?.("PoC mock face match successful.");
  }

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
          hasShift={HAS_SHIFT}
          roster={MOCK_TODAY_ROSTER}
        />
      )}

      {/* ─── Task 123 webcam PoC dialog ───────────────────────────────────── */}
      <FaceIdPocDialog
        open={cameraOpen}
        onClose={handleCloseCameraDialog}
        onContinue={handleContinueToKiosk}
        videoRef={videoRef}
        cameraError={cameraError}
        capturedPhoto={capturedPhoto}
        onCapture={handleCapturePhoto}
      />
    </Box>
  );
}