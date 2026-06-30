import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "./shared";

const BREAK_ALERT_WORKERS = [
  {
    id: "ba-1",
    staffId: "EMP-001",
    name: "John Smith",
    station: "South Gate",
    clockIn: "07:00",
  },
  {
    id: "ba-2",
    staffId: "EMP-004",
    name: "Sarah Lee",
    station: "East Gate",
    clockIn: "07:30",
  },
];

const ALERT_DAY_LABEL = "20 Apr 2026";
const ALERT_APPROACHING_MINUTES = 4 * 60 + 30;
const ALERT_EXCEEDED_MINUTES = 5 * 60;
const SIMULATED_START_MINUTES = 12 * 60 + 8;

function nowStamp() {
  return new Date().toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseClockToMinutes(clockText) {
  const [hRaw, mRaw] = String(clockText).split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function formatMinutesToClock(totalMinutes) {
  const safe = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (safe % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatWorkedDuration(totalMinutes) {
  const safe = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${hours}h ${minutes}m`;
}

export default function BreakAlertsTab({ showToast }) {
  const { currentUser } = useAuth();
  const [breakAlerts, setBreakAlerts] = useState(() =>
    BREAK_ALERT_WORKERS.map((worker) => ({
      ...worker,
      clockInMinutes: parseClockToMinutes(worker.clockIn),
      breakLoggedAt: null,
      timeWorkedAtAlert: "",
      clearedAt: "",
    })),
  );
  const [simulatedNowMinutes, setSimulatedNowMinutes] = useState(
    SIMULATED_START_MINUTES,
  );
  const [acknowledgedBreakAlertIds, setAcknowledgedBreakAlertIds] = useState(
    [],
  );
  const [resolvedNotes, setResolvedNotes] = useState([]);
  const [eodEmailSentAt, setEodEmailSentAt] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSimulatedNowMinutes((prev) => {
        if (prev >= 23 * 60 + 59) return prev;
        return prev + 1;
      });
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  const activeBreakAlertRows = useMemo(() => {
    return breakAlerts
      .filter((row) => !row.breakLoggedAt)
      .map((row) => {
        const workedMinutes = Math.max(
          0,
          simulatedNowMinutes - row.clockInMinutes,
        );
        const status =
          workedMinutes >= ALERT_EXCEEDED_MINUTES ? "exceeded" : "approaching";

        return {
          id: row.id,
          staffId: row.staffId,
          name: row.name,
          station: row.station,
          clockIn: row.clockIn,
          workedMinutes,
          timeWorked: formatWorkedDuration(workedMinutes),
          breakLogged: "None",
          status,
          statusLabel:
            status === "exceeded" ? "Exceeded 5h - no break" : "Approaching 5h",
        };
      })
      .filter((row) => row.workedMinutes >= ALERT_APPROACHING_MINUTES)
      .filter((row) => !acknowledgedBreakAlertIds.includes(row.id));
  }, [acknowledgedBreakAlertIds, breakAlerts, simulatedNowMinutes]);

  const clearedBreakRows = useMemo(() => {
    return breakAlerts
      .filter((row) => Boolean(row.breakLoggedAt))
      .map((row) => ({
        id: row.id,
        staffId: row.staffId,
        name: row.name,
        station: row.station,
        clockIn: row.clockIn,
        breakLoggedAt: row.breakLoggedAt,
        timeWorkedAtAlert: row.timeWorkedAtAlert,
      }));
  }, [breakAlerts]);

  const noBreakRows = useMemo(() => {
    return activeBreakAlertRows
      .filter((row) => row.status === "exceeded")
      .map((row) => ({
        ...row,
        date: ALERT_DAY_LABEL,
      }));
  }, [activeBreakAlertRows]);

  const approachingBreakCount = activeBreakAlertRows.filter(
    (row) => row.status === "approaching",
  ).length;
  const exceededBreakCount = activeBreakAlertRows.filter(
    (row) => row.status === "exceeded",
  ).length;

  function logBreakForWorker(alertRow) {
    const workedAtAlert = formatWorkedDuration(
      Math.max(0, simulatedNowMinutes - parseClockToMinutes(alertRow.clockIn)),
    );

    setBreakAlerts((prev) =>
      prev.map((row) =>
        row.id === alertRow.id
          ? {
              ...row,
              breakLoggedAt: formatMinutesToClock(simulatedNowMinutes),
              timeWorkedAtAlert: workedAtAlert,
              clearedAt: nowStamp(),
            }
          : row,
      ),
    );

    const actor = `${currentUser?.name ?? "Admin"} (${currentUser?.staffId ?? "A-001"})`;
    setResolvedNotes((prev) => [
      `${alertRow.staffId} ${alertRow.name} - break logged, threshold alert auto-cleared (${actor})`,
      ...prev,
    ]);
    showToast?.(`Break logged for ${alertRow.name}. Alert cleared.`);
  }

  return (
    <div>
      <PageHeader
        title="Break Threshold Alerts"
        description="Workers approaching or exceeding 5 hours without a meal break."
      />

      <Alert
        severity={activeBreakAlertRows.length > 0 ? "warning" : "success"}
        sx={{ mb: 1.5, borderRadius: 1.5 }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {activeBreakAlertRows.length > 0
            ? `${activeBreakAlertRows.length} workers require attention - approaching or exceeding 5-hour break threshold`
            : "No active break-threshold alerts"}
        </Typography>
        <Typography variant="caption">
          Approaching: {approachingBreakCount} · Exceeded 5h:{" "}
          {exceededBreakCount} · Day: {ALERT_DAY_LABEL} · Simulated time:{" "}
          {formatMinutesToClock(simulatedNowMinutes)}
        </Typography>
      </Alert>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2.5 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                "Worker",
                "Station",
                "Clocked In",
                "Time Worked",
                "Last Break",
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
            {activeBreakAlertRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{`${row.staffId} ${row.name}`}</TableCell>
                <TableCell>{row.station}</TableCell>
                <TableCell>{row.clockIn}</TableCell>
                <TableCell>{row.timeWorked}</TableCell>
                <TableCell>
                  <Typography color="error.main">{row.breakLogged}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.statusLabel}
                    color={row.status === "exceeded" ? "error" : "warning"}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      disableElevation
                      onClick={() => logBreakForWorker(row)}
                    >
                      Log Break
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={() =>
                        setAcknowledgedBreakAlertIds((prev) =>
                          prev.includes(row.id) ? prev : [...prev, row.id],
                        )
                      }
                    >
                      Acknowledge
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {activeBreakAlertRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography
                    variant="body2"
                    color="success.main"
                    sx={{ py: 0.5 }}
                  >
                    ✓ No active break-threshold alerts.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
        Recently Cleared Today
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
        Alerts auto-cleared when the worker logged a break. Persists until end
        of day.
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2.5 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                "Worker",
                "Station",
                "Clocked In",
                "Break Logged At",
                "Time Worked at Alert",
                "Cleared",
              ].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {clearedBreakRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{`${row.staffId} ${row.name}`}</TableCell>
                <TableCell>{row.station}</TableCell>
                <TableCell>{row.clockIn}</TableCell>
                <TableCell>{row.breakLoggedAt}</TableCell>
                <TableCell>{row.timeWorkedAtAlert}</TableCell>
                <TableCell>
                  <Chip size="small" color="success" label="Auto-cleared" />
                </TableCell>
              </TableRow>
            ))}
            {clearedBreakRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 0.5 }}
                  >
                    No alerts cleared yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
        End-of-Day Exception Email
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
        Workers who reached 5 hours without a break are included in the
        end-of-day exception email.
      </Typography>

      <Alert severity="info" sx={{ mb: 1.5, borderRadius: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Inclusion count: {noBreakRows.length} worker(s)
        </Typography>
        <Typography variant="caption">
          {eodEmailSentAt
            ? `Email sent at ${eodEmailSentAt}`
            : "Will be included in end-of-day exception email."}
        </Typography>
      </Alert>

      <Button
        variant="contained"
        disableElevation
        color="warning"
        sx={{ textTransform: "none", fontWeight: 700 }}
        onClick={() => {
          const stamp = nowStamp();
          setEodEmailSentAt(stamp);
          showToast?.(
            `End-of-day exception email sent. Included ${noBreakRows.length} no-break worker(s).`,
          );
        }}
      >
        Send End-of-Day Email
      </Button>

      <Box sx={{ mt: 2 }}>
        {resolvedNotes.slice(0, 3).map((note, idx) => (
          <Alert key={`${note}-${idx}`} severity="success" sx={{ mt: 1 }}>
            {note}
          </Alert>
        ))}
      </Box>
    </div>
  );
}
