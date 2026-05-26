import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../auth/AuthContext.jsx";
import { PageHeader } from "./shared.jsx";

const HEADER_BG = "#9b3440";

const MOCK_MISSED_CLOCK_OUT = [
  {
    id: "m-1",
    staffId: "EMP-003",
    name: "Maria Genero",
    date: "19 Apr",
    clockIn: "07:45",
    station: "South Gate",
    hours: "8.5h+",
    flaggedAt: "End of day",
  },
  {
    id: "m-2",
    staffId: "EMP-009",
    name: "James Park",
    date: "20 Apr",
    clockIn: "08:00",
    station: "North Shed",
    hours: "6.2h+",
    flaggedAt: "18:15 today",
  },
];

const MOCK_UNROSTERED = [
  {
    id: "u-1",
    staffId: "EMP-012",
    name: "Dan Nguyen",
    date: "20 Apr 2026",
    clockIn: "06:55",
    station: "East Gate",
    rosterEntry: "None — not rostered",
    flaggedAt: "06:56",
  },
];

function nowStamp() {
  return new Date().toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ExceptionsTab({ showToast }) {
  const { currentUser, currentRole } = useAuth();

  const [missedClockOutRows, setMissedClockOutRows] = useState(
    MOCK_MISSED_CLOCK_OUT,
  );
  const [unrosteredRows, setUnrosteredRows] = useState(MOCK_UNROSTERED);
  const [resolvedNotes, setResolvedNotes] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  const [ackDialog, setAckDialog] = useState({
    open: false,
    section: null,
    record: null,
  });
  const [ackReason, setAckReason] = useState("");
  const [ackError, setAckError] = useState("");

  const [rosterDialog, setRosterDialog] = useState({
    open: false,
    record: null,
  });
  const [rosterForm, setRosterForm] = useState({
    scheduledStart: "",
    scheduledEnd: "",
    rolePosition: "",
  });
  const [rosterErrors, setRosterErrors] = useState({});

  const totalOpenCount = missedClockOutRows.length + unrosteredRows.length;

  const todaySummary = useMemo(() => {
    return [
      `${missedClockOutRows.length} missed clock-outs`,
      `${unrosteredRows.length} unrostered clock-in`,
      "End-of-day report sent via email",
    ].join("  ·  ");
  }, [missedClockOutRows.length, unrosteredRows.length]);

  function appendResolved(message) {
    setResolvedNotes((prev) => [message, ...prev]);
  }

  function appendAudit(entry) {
    setAuditLog((prev) => [entry, ...prev]);
  }

  function openAck(section, record) {
    setAckError("");
    setAckReason("");
    setAckDialog({ open: true, section, record });
  }

  function closeAck() {
    setAckDialog({ open: false, section: null, record: null });
    setAckReason("");
    setAckError("");
  }

  function resolveByAcknowledge() {
    const reason = ackReason.trim();
    if (!reason) {
      setAckError("Reason for acknowledgement is required.");
      return;
    }

    const record = ackDialog.record;
    if (!record) return;

    if (ackDialog.section === "unrostered") {
      setUnrosteredRows((prev) => prev.filter((row) => row.id !== record.id));
    }
    if (ackDialog.section === "missed") {
      setMissedClockOutRows((prev) =>
        prev.filter((row) => row.id !== record.id),
      );
    }

    const actor = `${currentUser?.name ?? "Admin"} (${currentUser?.staffId ?? "A-001"})`;
    const stamp = nowStamp();
    appendAudit({
      action: "ACK_RESOLVE",
      staffId: record.staffId,
      timestamp: stamp,
      actor,
      reason,
    });
    appendResolved(
      `${record.staffId} ${record.name} — exception acknowledged as resolved (${stamp})`,
    );

    showToast?.("Exception resolved and audit log recorded.");
    closeAck();
  }

  function openRoster(record) {
    setRosterErrors({});
    setRosterForm({
      scheduledStart: record.clockIn,
      scheduledEnd: "",
      rolePosition: "",
    });
    setRosterDialog({ open: true, record });
  }

  function closeRoster() {
    setRosterDialog({ open: false, record: null });
    setRosterErrors({});
    setRosterForm({ scheduledStart: "", scheduledEnd: "", rolePosition: "" });
  }

  function resolveByRetrospectiveRoster() {
    const errors = {};
    if (!rosterForm.scheduledStart.trim()) {
      errors.scheduledStart = "Scheduled start is required.";
    }
    if (!rosterForm.scheduledEnd.trim()) {
      errors.scheduledEnd = "Scheduled end is required.";
    }
    if (Object.keys(errors).length > 0) {
      setRosterErrors(errors);
      return;
    }

    const record = rosterDialog.record;
    if (!record) return;

    setUnrosteredRows((prev) => prev.filter((row) => row.id !== record.id));

    const stamp = nowStamp();
    const actor = `${currentUser?.name ?? "Admin"} (${currentUser?.staffId ?? "A-001"})`;
    appendAudit({
      action: "RETRO_ROSTER_RESOLVE",
      staffId: record.staffId,
      timestamp: stamp,
      actor,
      reason: `Start ${rosterForm.scheduledStart}, End ${rosterForm.scheduledEnd}`,
    });
    appendResolved(
      `${record.staffId} ${record.name} — roster added retrospectively, exception resolved`,
    );

    showToast?.("Retrospective roster added. Exception resolved.");
    closeRoster();
  }

  function resolveMissedByApprovedAmendment(record) {
    const allowed = currentRole === "OFFICE_ADMIN" || currentRole === "MANAGER";
    if (!allowed) {
      showToast?.(
        "Only Office Admin or Manager/Supervisor can approve amendment.",
        true,
      );
      return;
    }

    setMissedClockOutRows((prev) => prev.filter((row) => row.id !== record.id));

    const stamp = nowStamp();
    const actor = `${currentUser?.name ?? "Admin"} (${currentUser?.staffId ?? "A-001"})`;
    appendAudit({
      action: "AUTO_RESOLVED_BY_AMENDMENT",
      staffId: record.staffId,
      timestamp: stamp,
      actor,
      reason: "Clock-out amendment approved and record became complete",
    });
    appendResolved(
      `${record.staffId} ${record.name} — exception removed after approved amendment`,
    );

    showToast?.("Approved amendment detected. Missed clock-out removed.");
  }

  const dialogHeaderSx = {
    bgcolor: HEADER_BG,
    color: "common.white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    py: 1.5,
    px: 2.5,
  };

  return (
    <div>
      <PageHeader
        title="Exceptions Dashboard"
        description="Active flags requiring attention — 20 Apr 2026"
      />

      <Alert
        severity={totalOpenCount > 0 ? "error" : "success"}
        sx={{ mb: 2, borderRadius: 1.5 }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {totalOpenCount} exceptions require attention today
        </Typography>
        <Typography variant="caption">{todaySummary}</Typography>
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
          Missed Clock-Out
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
          Staff who clocked in but have no clock-out record for the day.
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  "Staff",
                  "Date",
                  "Clock In",
                  "Station",
                  "Hours so far",
                  "Flagged At",
                  "Actions",
                ].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {missedClockOutRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{`${row.staffId} ${row.name}`}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.clockIn}</TableCell>
                  <TableCell>{row.station}</TableCell>
                  <TableCell>{row.hours}</TableCell>
                  <TableCell>{row.flaggedAt}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" color="inherit">
                        View Record
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disableElevation
                        onClick={() => resolveMissedByApprovedAmendment(row)}
                      >
                        Approve Amendment
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {missedClockOutRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        py: 0.5,
                      }}
                    >
                      <Chip size="small" color="success" label="✓ Resolved" />
                      <Typography color="success.main" variant="body2">
                        Missing clock-out exceptions were automatically removed
                        after approved amendments.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
          Unrostered Clock-In
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
          Workers who clocked in without a roster entry. Clock-in allowed
          (default policy). Mgr/Supervisor notified.
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  "Staff",
                  "Date",
                  "Clock In",
                  "Station",
                  "Roster Entry",
                  "Flagged",
                  "Actions",
                ].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {unrosteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{`${row.staffId} ${row.name}`}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.clockIn}</TableCell>
                  <TableCell>{row.station}</TableCell>
                  <TableCell>
                    <Typography color="error.main">
                      {row.rosterEntry}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.flaggedAt}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disableElevation
                        onClick={() => openRoster(row)}
                      >
                        Add Roster
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => openAck("unrostered", row)}
                      >
                        Acknowledge
                      </Button>
                      <Button size="small" variant="outlined" color="inherit">
                        View Record
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {unrosteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography
                      variant="body2"
                      color="success.main"
                      sx={{ py: 0.5 }}
                    >
                      ✓ All unrostered clock-in exceptions resolved.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ my: 2.5 }} />

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
          Exception Report
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Auto-generated at end of day and sent via email. Generate on demand at
          any time.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            disableElevation
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: HEADER_BG,
              "&:hover": { bgcolor: "#7d2834" },
            }}
            onClick={() => showToast?.("Exception report generated.")}
          >
            Generate Now
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ textTransform: "none" }}
            onClick={() => showToast?.("CSV download is mocked in this view.")}
          >
            Download CSV
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mt: 2 }}>
        {resolvedNotes.slice(0, 3).map((note, idx) => (
          <Alert key={`${note}-${idx}`} severity="success" sx={{ mt: 1 }}>
            {note}
          </Alert>
        ))}
      </Box>

      {/* Acknowledge & Resolve */}
      <Dialog
        open={ackDialog.open}
        onClose={closeAck}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        <DialogTitle sx={dialogHeaderSx}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Acknowledge Exception
          </Typography>
          <IconButton onClick={closeAck} sx={{ color: "common.white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          {ackDialog.record ? (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
              <Typography sx={{ fontWeight: 700 }}>
                Worker: {ackDialog.record.staffId} {ackDialog.record.name} ·
                Date: {ackDialog.record.date}
              </Typography>
              <Typography color="text.secondary">
                Clock In: {ackDialog.record.clockIn} · Station:{" "}
                {ackDialog.record.station}
              </Typography>
            </Paper>
          ) : null}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
            Reason for Acknowledgement *
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="e.g. Worker confirmed via phone — shift was approved verbally by manager"
            value={ackReason}
            onChange={(e) => {
              setAckReason(e.target.value);
              if (ackError) setAckError("");
            }}
            error={!!ackError}
            helperText={ackError || " "}
          />

          <Alert severity="info" sx={{ mt: 1 }}>
            Exception will be marked as Resolved. Your staff ID, timestamp and
            reason will be recorded in the audit log.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button
            variant="contained"
            disableElevation
            onClick={resolveByAcknowledge}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: HEADER_BG,
              "&:hover": { bgcolor: "#7d2834" },
            }}
          >
            Acknowledge &amp; Resolve
          </Button>
          <Button variant="outlined" color="inherit" onClick={closeAck}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Retrospective Roster Entry */}
      <Dialog
        open={rosterDialog.open}
        onClose={closeRoster}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        <DialogTitle sx={dialogHeaderSx}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Add Retrospective Roster Entry
          </Typography>
          <IconButton onClick={closeRoster} sx={{ color: "common.white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          {rosterDialog.record ? (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
              <Typography sx={{ fontWeight: 700 }}>
                Worker: {rosterDialog.record.staffId} {rosterDialog.record.name}{" "}
                · Date: {rosterDialog.record.date}
              </Typography>
              <Typography color="text.secondary">
                Clock In: {rosterDialog.record.clockIn} · Station:{" "}
                {rosterDialog.record.station} · No roster entry found
              </Typography>
              <Typography color="text.secondary">
                Adding a roster entry will retrospectively approve this
                clock-in.
              </Typography>
            </Paper>
          ) : null}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Scheduled Start *"
              value={rosterForm.scheduledStart}
              onChange={(e) =>
                setRosterForm((prev) => ({
                  ...prev,
                  scheduledStart: e.target.value,
                }))
              }
              error={!!rosterErrors.scheduledStart}
              helperText={rosterErrors.scheduledStart || " "}
            />
            <TextField
              label="Scheduled End *"
              placeholder="HH:MM"
              value={rosterForm.scheduledEnd}
              onChange={(e) =>
                setRosterForm((prev) => ({
                  ...prev,
                  scheduledEnd: e.target.value,
                }))
              }
              error={!!rosterErrors.scheduledEnd}
              helperText={rosterErrors.scheduledEnd || " "}
            />
          </Box>

          <TextField
            fullWidth
            label="Role / Position"
            placeholder="e.g. Picker, Packer"
            value={rosterForm.rolePosition}
            onChange={(e) =>
              setRosterForm((prev) => ({
                ...prev,
                rolePosition: e.target.value,
              }))
            }
            sx={{ mt: 1 }}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            Roster entry will be added retrospectively. Exception marked as
            Resolved. Your staff ID and timestamp will be recorded in the audit
            log.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button
            variant="contained"
            disableElevation
            onClick={resolveByRetrospectiveRoster}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: HEADER_BG,
              "&:hover": { bgcolor: "#7d2834" },
            }}
          >
            Add Roster &amp; Resolve
          </Button>
          <Button variant="outlined" color="inherit" onClick={closeRoster}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
