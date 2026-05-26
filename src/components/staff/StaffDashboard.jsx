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
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
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

const MOCK_ATTENDANCE = {
  clockInStation: "North Shed",
  clockOutStation: "East Gate",
  clockInTime: "07:00 AM",
  scheduledEnd: "03:00 PM",
  clockOutTime: "03:00 PM",
  totalHours: "8 hrs",
};

const BREAK_REASONS = [
  { value: "meal", label: "Meal", description: "Scheduled meal break" },
  { value: "rest", label: "Rest", description: "Short rest break" },
  { value: "personal", label: "Personal", description: "Personal reason" },
  { value: "emergency", label: "Emergency", description: "Emergency situation" },
  { value: "other", label: "Other", description: "Specify below" },
];

const MOCK_BREAK = {
  type: "Meal",
  startTime: "10:00 AM",
  endTime: "10:32 AM",
  duration: "32 minutes",
};

function getBreakReasonLabel(value) {
  return BREAK_REASONS.find((reason) => reason.value === value)?.label || "Meal";
}

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

function ClockInPanel() {
  return (
    <Box>
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          backgroundColor: "#c8e8c8",
          mb: 3,
        }}
      >
        <Typography sx={{ fontWeight: 700, color: "#1b5e20" }}>
          ✓ Clock In Recorded
        </Typography>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
        Shift Summary
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        <RosterInfoCard
          label="Clock-in Station"
          value={MOCK_ATTENDANCE.clockInStation}
        />
        <RosterInfoCard label="Clock In" value={MOCK_ATTENDANCE.clockInTime} />
        <RosterInfoCard
          label="Scheduled End"
          value={MOCK_ATTENDANCE.scheduledEnd}
        />
      </Box>
    </Box>
  );
}

function ClockOutPanel() {
  return (
    <Box>
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          backgroundColor: "#c8e8c8",
          mb: 3,
        }}
      >
        <Typography sx={{ fontWeight: 700, color: "#1b5e20" }}>
          ✓ Clock Out Recorded
        </Typography>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
        Shift Summary
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
          mb: 2,
        }}
      >
        <RosterInfoCard
          label="Clock-in Station"
          value={MOCK_ATTENDANCE.clockInStation}
        />
        <RosterInfoCard
          label="Clock-out Station"
          value={MOCK_ATTENDANCE.clockOutStation}
        />
        <RosterInfoCard label="Clock In" value={MOCK_ATTENDANCE.clockInTime} />
        <RosterInfoCard label="Clock Out" value={MOCK_ATTENDANCE.clockOutTime} />
        <RosterInfoCard label="Total Hours" value={MOCK_ATTENDANCE.totalHours} />
      </Box>

      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          backgroundColor: "#fff4d6",
          border: "1px solid",
          borderColor: "#f1d58a",
        }}
      >
        <Typography sx={{ fontWeight: 700, color: "#c47a00", mb: 0.5 }}>
          ℹ️ Cross-station clock-out detected
        </Typography>

        <Typography variant="body2" sx={{ color: "#6d4c00" }}>
          Clock-in station ({MOCK_ATTENDANCE.clockInStation}) and clock-out
          station ({MOCK_ATTENDANCE.clockOutStation}) have both been recorded
          with your attendance entry.
        </Typography>
      </Box>
    </Box>
  );
}

function StartBreakPanel({
  selectedReason,
  setSelectedReason,
  breakNote,
  setBreakNote,
  onConfirm,
  onCancel,
}) {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Select Break Reason
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Choose the reason for your break before starting.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
          mb: 2,
        }}
      >
        {BREAK_REASONS.map((reason) => {
          const isSelected = selectedReason === reason.value;

          return (
            <Box
              key={reason.value}
              onClick={() => setSelectedReason(reason.value)}
              sx={{
                position: "relative",
                p: 2,
                minHeight: 92,
                borderRadius: 1.5,
                cursor: "pointer",
                backgroundColor: isSelected ? "#e7f4e8" : "#f3efe9",
                border: "2px solid",
                borderColor: isSelected ? "#2f8a3d" : "transparent",
                "&:hover": {
                  borderColor: "#2f8a3d",
                },
              }}
            >
              {isSelected ? (
                <Box
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "#2f8a3d",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </Box>
              ) : null}

              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                {reason.label}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {reason.description}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <TextField
        fullWidth
        label="Additional note"
        placeholder="e.g. Doctor's appointment"
        value={breakNote}
        onChange={(event) => setBreakNote(event.target.value)}
        helperText="Required only when Other is selected"
        sx={{ mb: 2 }}
      />

      <Stack direction="row" spacing={2}>
        <PrimaryButton
          onClick={onConfirm}
          sx={{
            width: 220,
            py: 1.2,
            backgroundColor: "#2f8a3d",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { backgroundColor: "#277434" },
            color: "#ffffff",
          }}
        >
          Start Break
        </PrimaryButton>

        <GhostButton
          onClick={onCancel}
          sx={{ width: 160, py: 1.2, textTransform: "none" }}
        >
          Cancel
        </GhostButton>
      </Stack>
    </Box>
  );
}

function BreakStartedPanel({ selectedReason }) {
  return (
    <Box>
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          backgroundColor: "#c8e8c8",
          mb: 3,
        }}
      >
        <Typography sx={{ fontWeight: 700, color: "#1b5e20" }}>
          ✓ Break Started
        </Typography>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
        Break Summary
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 2,
          mb: 2,
        }}
      >
        <RosterInfoCard
          label="Break Type"
          value={getBreakReasonLabel(selectedReason)}
        />
        <RosterInfoCard label="Break Start" value={MOCK_BREAK.startTime} />
      </Box>

      <Typography variant="body2" color="text.secondary">
        When the worker returns, select End Break to record the end time and
        calculate the break duration.
      </Typography>
    </Box>
  );
}

function EndBreakPanel({ selectedReason, onConfirm, onCancel }) {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        End Break
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Your break end time will be recorded and duration calculated.
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
        Break Summary
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
          gap: 2,
          mb: 4,
        }}
      >
        <RosterInfoCard
          label="Break Type"
          value={getBreakReasonLabel(selectedReason)}
        />
        <RosterInfoCard label="Break Start" value={MOCK_BREAK.startTime} />
        <RosterInfoCard label="Break End" value={MOCK_BREAK.endTime} />
        <RosterInfoCard label="Duration" value={MOCK_BREAK.duration} />
      </Box>

      <Stack direction="row" spacing={2}>
        <PrimaryButton
          onClick={onConfirm}
          sx={{
            width: 260,
            py: 1.2,
            backgroundColor: "#2f8a3d",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { backgroundColor: "#277434" },
            color: "#ffffff",
          }}
        >
          Confirm End Break
        </PrimaryButton>

        <GhostButton
          onClick={onCancel}
          sx={{ width: 160, py: 1.2, textTransform: "none" }}
        >
          Cancel
        </GhostButton>
      </Stack>
    </Box>
  );
}

function SupervisorAssistancePanel({ onConfirm, onCancel }) {
  const [supervisorPin, setSupervisorPin] = useState("");
  const keypadItems = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "✓"];

  const handlePinPress = (item) => {
    if (item === "←") {
      setSupervisorPin((currentPin) => currentPin.slice(0, -1));
      return;
    }

    if (item === "✓") {
      return;
    }

    setSupervisorPin((currentPin) => {
      if (currentPin.length >= 4) return currentPin;
      return currentPin + item;
    });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Supervisor Assistance
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Override clock in or out on behalf of this worker.
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
          gap: 4,
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Supervisor PIN
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Enter your 4-digit PIN to authorise.
          </Typography>

          <Box
            sx={{
              mt: 1,
              mb: 1.5,
              height: 48,
              borderRadius: 1.5,
              backgroundColor: "#eeeeee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            {supervisorPin.split("").map((_, dotIndex) => (
              <Box
                key={dotIndex}
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  backgroundColor: "#6b6b6b",
                }}
              />
            ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gridTemplateRows: "repeat(4, 1fr)",
              gap: 1,
              flexGrow: 1,
              minHeight: 210,
            }}
          >
            {keypadItems.map((item) => {
              const isBack = item === "←";
              const isConfirm = item === "✓";

              return (
                <Box
                  key={item}
                  component="button"
                  type="button"
                  onClick={() => handlePinPress(item)}
                  sx={{
                    height: "100%",
                    minHeight: 52,
                    border: "none",
                    borderRadius: 1.5,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 18,
                    backgroundColor: isBack
                    ? "#f57c00"
                    : isConfirm
                    ? "#2f8a3d"
                    : "#f2f2f2",
                    color: isBack || isConfirm ? "#ffffff" : "#222222",
                    "&:hover": {
                      opacity: 0.9,
                    },
                  }}
                >
                  {item}
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            Override Details
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Worker"
            value={`${MOCK_WORKER.name} (${MOCK_WORKER.id})`}
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Action *
          </Typography>

          <RadioGroup row defaultValue="clock-in" sx={{ mb: 2 }}>
            <FormControlLabel
              value="clock-in"
              control={<Radio size="small" />}
              label="Clock In"
            />
            <FormControlLabel
              value="clock-out"
              control={<Radio size="small" />}
              label="Clock Out"
            />
          </RadioGroup>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Reason *"
            defaultValue="Worker's keycard failed. Device confirmed faulty. Supervisor authorising manual clock-in."
            sx={{ mb: 3 }}
          />

          <Stack direction="row" spacing={2}>
            <PrimaryButton
              onClick={onConfirm}
              sx={{
                width: 260,
                py: 1.2,
                backgroundColor: "#9b3440",
                textTransform: "none",
                fontWeight: 700,
                "&:hover": { backgroundColor: "#852d37" },
                color: "#ffffff"
              }}
            >
              Confirm
            </PrimaryButton>

            <GhostButton
              onClick={onCancel}
              sx={{ width: 160, py: 1.2, textTransform: "none" }}
            >
              Cancel
            </GhostButton>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

function IdentifiedState({
  selectedReason,
  setSelectedReason,
  breakNote,
  setBreakNote,
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
              src={frodoProfile}
              alt={MOCK_WORKER.name}
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
            onClick={() => onAction("supervisor-assistance")}
            sx={{
              backgroundColor: "#858585",
              color: "#ffffff",
              "&:hover": { backgroundColor: "#aeaeae" },
            }}
          >
            Supervisor Assistance
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
        ) : activePanel === "clock-in" ? (
          <ClockInPanel />
        ) : activePanel === "clock-out" ? (
          <ClockOutPanel />
        ) : activePanel === "start-break" ? (
          <StartBreakPanel
            selectedReason={selectedReason}
            setSelectedReason={setSelectedReason}
            breakNote={breakNote}
            setBreakNote={setBreakNote}
            onConfirm={() => onAction("break-started")}
            onCancel={() => onAction("roster")}
          />
        ) : activePanel === "break-started" ? (
          <BreakStartedPanel selectedReason={selectedReason} />
        ) : activePanel === "end-break" ? (
          <EndBreakPanel
            selectedReason={selectedReason}
            onConfirm={() => onAction("roster")}
            onCancel={() => onAction("break-started")}
          />
        ) : activePanel === "supervisor-assistance" ? (
          <SupervisorAssistancePanel
            onConfirm={() => onAction("roster")}
            onCancel={() => onAction("roster")}
          />
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
  const [selectedReason, setSelectedReason] = useState("meal");
  const [breakNote, setBreakNote] = useState("");
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
    setSelectedReason("meal");
    setBreakNote("");
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
          breakNote={breakNote}
          setBreakNote={setBreakNote}
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