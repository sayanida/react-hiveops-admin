import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useAuth } from "../auth/AuthContext.jsx";
import { mockStaffRows } from "../mocks/staffAdminMockData.js";
import {
  GhostButton,
  normalizeList,
  PageHeader,
  PanelCard,
} from "./shared.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────
const HEADER_BG = "#9b3440";

const INITIAL_AMENDMENTS = [
  {
    id: 1,
    empCode: "EMP-009",
    staffName: "John K.",
    action: "Clock In",
    dateTime: "20 Apr  14:35",
    submittedByName: "Saya Yoshida (Admin)",
    submittedById: "A-001",
    reason: "Worker's keycard failed at North Shed.",
    status: "PENDING",
  },
  {
    id: 2,
    empCode: "EMP-003",
    staffName: "Maria G.",
    action: "Clock In",
    dateTime: "19 Apr  07:45",
    submittedByName: "Alex Brown (Admin)",
    submittedById: "A-002",
    reason: "Device failure at South Gate",
    status: "PENDING",
  },
  {
    id: 3,
    empCode: "EMP-007",
    staffName: "Tom W.",
    action: "Clock Out",
    dateTime: "18 Apr  17:02",
    submittedByName: "Alex Brown (Admin)",
    submittedById: "A-002",
    reason: "Worker left site without clocking",
    status: "PENDING",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEmpCode(id) {
  return `EMP-${String(id).padStart(3, "0")}`;
}

function shortName(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/);
  if (parts.length < 2) return name;
  return (
    parts[0] +
    " " +
    parts
      .slice(1)
      .map((p) => p[0] + ".")
      .join(" ")
  );
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeStr() {
  return new Date().toTimeString().slice(0, 5);
}

const FORM_INIT = {
  staffId: "",
  action: "Clock In",
  date: todayStr(),
  time: nowTimeStr(),
  station: "",
  reason: "",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClockingTab({ showToast }) {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(FORM_INIT);
  const [amendments, setAmendments] = useState(INITIAL_AMENDMENTS);
  const [successBanner, setSuccessBanner] = useState(null);

  const staffRows = useMemo(() => normalizeList(mockStaffRows), []);
  const currentUserId = String(currentUser?.staffId ?? "");

  const setF = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    const staff = staffRows.find((r) => String(r.id) === String(form.staffId));
    if (!staff) return;

    const submitterName = currentUser?.name
      ? `${currentUser.name} (Admin)`
      : "Admin";
    const submitterId = String(currentUser?.staffId ?? "A-001");
    const submittedAt = new Date();

    const newEntry = {
      id: Date.now(),
      empCode: getEmpCode(staff.id),
      staffName: shortName(staff.name),
      action: form.action,
      dateTime: `${formatDateDisplay(form.date)}  ${form.time}`,
      submittedByName: submitterName,
      submittedById: submitterId,
      reason: form.reason,
      status: "PENDING",
    };

    setAmendments((prev) => [newEntry, ...prev]);
    setSuccessBanner({
      action: form.action,
      staffName: staff.name,
      submittedByName: submitterName,
      submittedAt,
      reason: form.reason,
    });
    setForm({ ...FORM_INIT, date: todayStr(), time: nowTimeStr() });
  }

  function handleCancel() {
    setForm({ ...FORM_INIT, date: todayStr(), time: nowTimeStr() });
    setSuccessBanner(null);
  }

  function handleApprove(id) {
    setAmendments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "APPROVED" } : a)),
    );
    showToast?.("Amendment approved.");
  }

  function handleReject(id) {
    setAmendments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "REJECTED" } : a)),
    );
    showToast?.("Amendment rejected.");
  }

  return (
    <div>
      <PageHeader
        title="Manual Clock-in and Clock-out"
        description="Manually clock a staff member in or out when they cannot do so themselves."
      />

      {/* ─── Success Banner ────────────────────────────────────────────────── */}
      {successBanner && (
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon />}
          onClose={() => setSuccessBanner(null)}
          sx={{ mb: 3, borderRadius: 1 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {successBanner.action} manually recorded for{" "}
            {successBanner.staffName}.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            [MANUAL]&nbsp;·&nbsp;Submitted by {successBanner.submittedByName}
            &nbsp;·&nbsp;
            {successBanner.submittedAt.toLocaleString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            &nbsp;·&nbsp;&ldquo;{successBanner.reason}&rdquo;
          </Typography>
        </Alert>
      )}

      {/* ─── Clock-in/out Form ─────────────────────────────────────────────── */}
      <PanelCard>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            maxWidth: 520,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label="Staff Member"
            select
            required
            size="small"
            value={form.staffId}
            onChange={setF("staffId")}
            fullWidth
          >
            <MenuItem value="" disabled>
              Select staff member...
            </MenuItem>
            {staffRows.map((s) => (
              <MenuItem key={s.id} value={String(s.id)}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Action *
            </Typography>
            <RadioGroup row value={form.action} onChange={setF("action")}>
              <FormControlLabel
                value="Clock In"
                control={
                  <Radio
                    size="small"
                    sx={{ "&.Mui-checked": { color: HEADER_BG } }}
                  />
                }
                label="Clock In"
              />
              <FormControlLabel
                value="Clock Out"
                control={
                  <Radio
                    size="small"
                    sx={{ "&.Mui-checked": { color: HEADER_BG } }}
                  />
                }
                label="Clock Out"
              />
            </RadioGroup>
          </Box>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Date"
              type="date"
              required
              size="small"
              value={form.date}
              onChange={setF("date")}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Time"
              type="time"
              required
              size="small"
              value={form.time}
              onChange={setF("time")}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <TextField
            label="Station (optional)"
            size="small"
            value={form.station}
            onChange={setF("station")}
            fullWidth
          />

          <TextField
            label="Reason"
            required
            multiline
            rows={4}
            size="small"
            value={form.reason}
            onChange={setF("reason")}
            fullWidth
          />

          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: HEADER_BG,
                "&:hover": { bgcolor: "#7d2834" },
              }}
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              sx={{ textTransform: "none" }}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </PanelCard>

      {/* ─── Pending Amendments Table ──────────────────────────────────────── */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Pending Amendments — Awaiting Approval
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  "Staff ID",
                  "Name",
                  "Action",
                  "Date / Time",
                  "Submitted By",
                  "Reason",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {amendments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ color: "text.secondary", py: 3 }}
                  >
                    No pending amendments.
                  </TableCell>
                </TableRow>
              ) : (
                amendments.map((entry) => {
                  const isSelf =
                    currentUserId !== "" &&
                    String(entry.submittedById) === currentUserId;
                  const isPending = entry.status === "PENDING";

                  return (
                    <TableRow
                      key={entry.id}
                      sx={
                        isSelf && isPending
                          ? { bgcolor: "rgba(46,125,50,0.06)" }
                          : undefined
                      }
                    >
                      <TableCell>{entry.empCode}</TableCell>
                      <TableCell>{entry.staffName}</TableCell>
                      <TableCell>{entry.action}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {entry.dateTime}
                      </TableCell>
                      <TableCell>{entry.submittedByName}</TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        {entry.reason}
                      </TableCell>
                      <TableCell>
                        {entry.status === "APPROVED" ? (
                          <Chip size="small" label="Approved" color="success" />
                        ) : entry.status === "REJECTED" ? (
                          <Chip size="small" label="Rejected" color="error" />
                        ) : (
                          <Chip
                            size="small"
                            label="Awaiting approval"
                            variant="outlined"
                            color={isSelf ? "default" : "warning"}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isPending && isSelf ? (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ fontStyle: "italic" }}
                          >
                            Cannot approve
                          </Typography>
                        ) : isPending ? (
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disableElevation
                              sx={{ textTransform: "none", fontSize: 12 }}
                              onClick={() => handleApprove(entry.id)}
                            >
                              ✓ Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              disableElevation
                              sx={{ textTransform: "none", fontSize: 12 }}
                              onClick={() => handleReject(entry.id)}
                            >
                              × Reject
                            </Button>
                          </Stack>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
}
