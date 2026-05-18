import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { adminApi as api } from "../utils/api.js";
import {
  PageHeader,
  PanelCard,
  FormActions,
  PrimaryButton,
  GhostButton,
} from "./shared.jsx";

const DEFAULT_DAILY_OVERTIME_HOURS = 8;
const DEFAULT_WEEKLY_OVERTIME_HOURS = 38;

const BREAK_REASONS = [
  {
    id: "meal",
    name: "Meal",
    description: "Scheduled meal break during shift",
  },
  { id: "rest", name: "Rest", description: "Short rest period during shift" },
  {
    id: "personal",
    name: "Personal",
    description: "Personal time away from work",
  },
  {
    id: "emergency",
    name: "Emergency",
    description: "Emergency circumstances",
  },
  { id: "other", name: "Other", description: "Any other break reason" },
];

const BREAK_INIT = Object.fromEntries(BREAK_REASONS.map((r) => [r.id, null]));

const HEADER_BG = "#9b3440";

const initialForm = {
  dailyOvertimeHours: DEFAULT_DAILY_OVERTIME_HOURS,
  weeklyOvertimeHours: DEFAULT_WEEKLY_OVERTIME_HOURS,
  saturdayPenalty: false,
  sundayPenalty: false,
  publicHolidayPenalty: false,
};
export default function SettingsTab({ showToast }) {
  const [form, setForm] = useState(initialForm);
  const [breakReasons, setBreakReasons] = useState(BREAK_INIT);
  const [breakErrors, setBreakErrors] = useState({});
  const [stationPolicy, setStationPolicy] = useState("warn_only");
  const [unrosteredPolicy, setUnrosteredPolicy] = useState("allow_flag");
  const lastErrorAtRef = useRef(0);
  const set = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  // ── Load current rules
  const {
    data: overtimeRules,
    isError: overtimeRulesIsError,
    errorUpdatedAt,
  } = useQuery({
    queryKey: ["overtimeRules"],
    queryFn: async () => {
      const res = await api.get("/settings/overtime-rules");
      const d = res.data || {};
      if (d.dailyOvertimeHours != null || d.weeklyOvertimeHours != null) {
        return d;
      }
      if (d["overtime-rules"]) {
        return d["overtime-rules"];
      }
      const settingsRes = await api.get("/settings");
      return settingsRes.data?.["overtime-rules"] || {};
    },
    refetchOnWindowFocus: false,
    retry: false,
  });
  useEffect(() => {
    if (!overtimeRules) return;
    const d = overtimeRules;
    setForm({
      dailyOvertimeHours: d.dailyOvertimeHours ?? DEFAULT_DAILY_OVERTIME_HOURS,
      weeklyOvertimeHours:
        d.weeklyOvertimeHours ?? DEFAULT_WEEKLY_OVERTIME_HOURS,
      saturdayPenalty: (d.penalty?.saturday ?? d.penalty?.weekend) === 1,
      sundayPenalty: (d.penalty?.sunday ?? d.penalty?.weekend) === 1,
      publicHolidayPenalty: d.penalty?.publicHoliday === 1,
    });
  }, [overtimeRules]);
  useEffect(() => {
    if (!overtimeRulesIsError) return;
    if (errorUpdatedAt === lastErrorAtRef.current) return;
    lastErrorAtRef.current = errorUpdatedAt;
    showToast("Failed to load overtime rules", true);
  }, [overtimeRulesIsError, errorUpdatedAt, showToast]);
  // ── Save rules
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const base = (
        localStorage.getItem("timeclock_api_base") || ""
      ).toLowerCase();
      const isJsonServerMock = /localhost:3001|127\.0\.0\.1:3001/.test(base);
      // for Mock test only
      if (isJsonServerMock) {
        const current = (await api.get("/settings")).data || {};
        return api.put("/settings", {
          ...current,
          "overtime-rules": {
            ...payload,
            updatedAt: new Date().toISOString(),
          },
        });
      }
      return api.post("/settings/overtime-rules", payload);
    },
    onSuccess: () => showToast("Overtime rules updated"),
    onError: (err) => {
      if (err?.response?.status === 403) {
        showToast("Office Admin role required", true);
        return;
      }
      showToast("Failed to save overtime rules", true);
    },
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    const hasDaily = String(form.dailyOvertimeHours).trim() !== "";
    const hasWeekly = String(form.weeklyOvertimeHours).trim() !== "";
    if (!hasDaily && !hasWeekly) {
      showToast("Daily or weekly overtime threshold is required.", true);
      return;
    }
    const daily = hasDaily ? Number(form.dailyOvertimeHours) : null;
    const weekly = hasWeekly ? Number(form.weeklyOvertimeHours) : null;
    if (
      (daily !== null && (!Number.isFinite(daily) || daily <= 0)) ||
      (weekly !== null && (!Number.isFinite(weekly) || weekly <= 0))
    ) {
      showToast("Overtime thresholds must be numbers greater than 0.", true);
      return;
    }
    const payload = {
      ...(daily !== null && {
        dailyOvertimeHours: daily,
      }),
      ...(weekly !== null && {
        weeklyOvertimeHours: weekly,
      }),
      penalty: {
        // Keep weekend for backwards compatibility with existing PoC payloads.
        weekend: form.saturdayPenalty || form.sundayPenalty ? 1 : 0,
        saturday: form.saturdayPenalty ? 1 : 0,
        sunday: form.sundayPenalty ? 1 : 0,
        publicHoliday: form.publicHolidayPenalty ? 1 : 0,
      },
    };
    saveMutation.mutate(payload);
  };
  const handleResetToDefaults = () => {
    setForm(initialForm);
    showToast("Settings reset to defaults");
  };

  const handleSaveBreakReasons = () => {
    const errors = {};
    BREAK_REASONS.forEach((r) => {
      if (breakReasons[r.id] === null) {
        errors[r.id] = "Please select Paid or Unpaid.";
      }
    });
    if (Object.keys(errors).length > 0) {
      setBreakErrors(errors);
      return;
    }
    setBreakErrors({});
    showToast("Break reason settings saved.");
  };

  const handleResetBreakReasons = () => {
    setBreakReasons(BREAK_INIT);
    setBreakErrors({});
  };

  const handleSaveStationPolicy = () => {
    showToast("Station policy saved.");
  };

  const handleSaveUnrosteredPolicy = () => {
    showToast("Unrostered clock-in policy saved.");
  };

  const setBreakChoice = (id, value) => {
    setBreakReasons((prev) => ({ ...prev, [id]: value }));
    setBreakErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  return (
    <div>
      <PageHeader
        title="System Settings"
        description="Configure system-wide overtime and penalty rules."
      />
      <PanelCard
        title="Overtime & Penalty Rules"
        component="form"
        noValidate
        onSubmit={handleSubmit}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Rules applied system-wide to classify overtime and penalty hours.
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{
            mt: 2.5,
            mb: 1,
            pb: 0.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          OVERTIME THRESHOLDS
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Daily overtime threshold
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                name="dailyOvertimeHours"
                type="number"
                value={form.dailyOvertimeHours}
                onChange={set}
                size="small"
                sx={{ width: { xs: 120, sm: 140 } }}
                inputProps={{ min: 0.01, step: 0.01 }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "nowrap" }}
              >
                hrs/day
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Weekly overtime threshold
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                name="weeklyOvertimeHours"
                type="number"
                value={form.weeklyOvertimeHours}
                onChange={set}
                size="small"
                sx={{ width: { xs: 120, sm: 140 } }}
                inputProps={{ min: 0.01, step: 0.01 }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "nowrap" }}
              >
                hrs/week
              </Typography>
            </Box>
          </Box>
        </Box>
        <Typography
          variant="subtitle2"
          sx={{
            mt: 2.5,
            mb: 1,
            pb: 0.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          PENALTY FLAGS
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
          When a worker clocks in on these days, hours are flagged at the
          applicable penalty rate.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 4 }}>
          <FormControlLabel
            control={
              <Checkbox
                name="saturdayPenalty"
                checked={form.saturdayPenalty}
                onChange={set}
              />
            }
            sx={{ alignItems: "flex-start", display: "flex", m: 0 }}
            label={
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, paddingTop: "6px" }}
                >
                  Saturday penalty rate
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Flag hours worked on Saturdays
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                name="sundayPenalty"
                checked={form.sundayPenalty}
                onChange={set}
              />
            }
            sx={{ alignItems: "flex-start", display: "flex", m: 0 }}
            label={
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, paddingTop: "6px" }}
                >
                  Sunday penalty rate
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Flag hours worked on Sundays
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                name="publicHolidayPenalty"
                checked={form.publicHolidayPenalty}
                onChange={set}
              />
            }
            sx={{ alignItems: "flex-start", display: "flex", m: 0 }}
            label={
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, paddingTop: "6px" }}
                >
                  Public Holiday penalty rate
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Flag hours worked on public holidays
                </Typography>
              </Box>
            }
          />
        </Box>
        <FormActions>
          <PrimaryButton type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </PrimaryButton>
          <GhostButton
            type="button"
            onClick={handleResetToDefaults}
            disabled={saveMutation.isPending}
          >
            Reset to Defaults
          </GhostButton>
        </FormActions>
      </PanelCard>

      {/* ─── Break Reasons ─────────────────────────────────────────────────── */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Break Reasons
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure whether each break reason counts as paid or unpaid time.
          This determines if break time is excluded from total hours worked.
        </Typography>

        <PanelCard>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
            Changes apply to future break records only. Existing break records
            are not affected.
          </Alert>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 700, width: 200 }}>
                    Break Reason
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 200 }}>
                    Paid / Unpaid
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {BREAK_REASONS.map((r) => {
                  const chosen = breakReasons[r.id];
                  const hasError = !!breakErrors[r.id];
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {r.name}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          Predefined
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {r.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex" }}>
                          <Button
                            size="small"
                            variant={
                              chosen === "paid" ? "contained" : "outlined"
                            }
                            disableElevation
                            onClick={() => setBreakChoice(r.id, "paid")}
                            sx={{
                              textTransform: "none",
                              borderRadius: "4px 0 0 4px",
                              ...(chosen === "paid"
                                ? {
                                    bgcolor: HEADER_BG,
                                    "&:hover": { bgcolor: "#7d2834" },
                                  }
                                : {
                                    borderColor: hasError
                                      ? "error.main"
                                      : "divider",
                                    color: hasError
                                      ? "error.main"
                                      : "text.secondary",
                                  }),
                            }}
                          >
                            Paid
                          </Button>
                          <Button
                            size="small"
                            variant={
                              chosen === "unpaid" ? "contained" : "outlined"
                            }
                            disableElevation
                            onClick={() => setBreakChoice(r.id, "unpaid")}
                            sx={{
                              textTransform: "none",
                              borderRadius: "0 4px 4px 0",
                              ml: "-1px",
                              ...(chosen === "unpaid"
                                ? {
                                    bgcolor: HEADER_BG,
                                    "&:hover": { bgcolor: "#7d2834" },
                                  }
                                : {
                                    borderColor: hasError
                                      ? "error.main"
                                      : "divider",
                                    color: hasError
                                      ? "error.main"
                                      : "text.secondary",
                                  }),
                            }}
                          >
                            Unpaid
                          </Button>
                        </Box>
                        {hasError && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            {breakErrors[r.id]}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", gap: 1.5, mt: 2.5 }}>
            <Button
              variant="contained"
              disableElevation
              onClick={handleSaveBreakReasons}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: HEADER_BG,
                "&:hover": { bgcolor: "#7d2834" },
              }}
            >
              Save Settings
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ textTransform: "none" }}
              onClick={handleResetBreakReasons}
            >
              Reset to Defaults
            </Button>
          </Box>
        </PanelCard>
      </Box>

      {/* ─── Station Clock-In / Clock-Out Policy ─────────────────────── */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Station Clock-In / Clock-Out Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Controls whether workers must use different stations for clock-in and
          clock-out.
        </Typography>

        <PanelCard title="Station Policy">
          <RadioGroup
            value={stationPolicy}
            onChange={(e) => setStationPolicy(e.target.value)}
          >
            <FormControlLabel
              value="warn_only"
              sx={{ alignItems: "flex-start", m: 0, mb: 1.5 }}
              control={
                <Radio
                  size="small"
                  sx={{ mt: "-2px", "&.Mui-checked": { color: HEADER_BG } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Warn only (default)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    System warns the worker if they use the same station for
                    both clock-in and clock-out, but still allows it.
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="enforce"
              sx={{ alignItems: "flex-start", m: 0 }}
              control={
                <Radio
                  size="small"
                  sx={{ mt: "-2px", "&.Mui-checked": { color: HEADER_BG } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Enforce different stations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    System blocks a worker from clocking out at the same station
                    they clocked in at.
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>

          <Divider sx={{ my: 2 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1.5 }}
          >
            Changes apply immediately to all future clock events.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="contained"
              disableElevation
              onClick={handleSaveStationPolicy}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: HEADER_BG,
                "&:hover": { bgcolor: "#7d2834" },
              }}
            >
              Save Changes
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ textTransform: "none" }}
              onClick={() => setStationPolicy("warn_only")}
            >
              Reset to Default
            </Button>
          </Box>
        </PanelCard>
      </Box>

      {/* ─── Unrostered Clock-In Policy ─────────────────────────────── */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Unrostered Clock-In Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Controls what happens when a worker clocks in without a roster entry
          for that day.
        </Typography>

        <PanelCard title="Unrostered Clock-In">
          <RadioGroup
            value={unrosteredPolicy}
            onChange={(e) => setUnrosteredPolicy(e.target.value)}
          >
            <FormControlLabel
              value="allow_flag"
              sx={{ alignItems: "flex-start", m: 0, mb: 1.5 }}
              control={
                <Radio
                  size="small"
                  sx={{ mt: "-2px", "&.Mui-checked": { color: HEADER_BG } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Allow and flag (default)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unrostered clock-in is allowed but flagged as an exception
                    and Mgr/Supervisor is notified.
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="block"
              sx={{ alignItems: "flex-start", m: 0 }}
              control={
                <Radio
                  size="small"
                  sx={{ mt: "-2px", "&.Mui-checked": { color: HEADER_BG } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Block unrostered clock-ins
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Worker is blocked from clocking in without a roster entry
                    for that day.
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="contained"
              disableElevation
              onClick={handleSaveUnrosteredPolicy}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: HEADER_BG,
                "&:hover": { bgcolor: "#7d2834" },
              }}
            >
              Save Changes
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ textTransform: "none" }}
              onClick={() => setUnrosteredPolicy("allow_flag")}
            >
              Reset to Default
            </Button>
          </Box>
        </PanelCard>
      </Box>
    </div>
  );
}
