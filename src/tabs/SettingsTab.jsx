import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
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

const initialForm = {
  dailyOvertimeHours: DEFAULT_DAILY_OVERTIME_HOURS,
  weeklyOvertimeHours: DEFAULT_WEEKLY_OVERTIME_HOURS,
  saturdayPenalty: false,
  sundayPenalty: false,
  publicHolidayPenalty: false,
};
export default function SettingsTab({ showToast }) {
  const [form, setForm] = useState(initialForm);
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
    </div>
  );
}
