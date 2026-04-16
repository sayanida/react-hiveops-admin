import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TextField, Checkbox, FormControlLabel } from "@mui/material";
import { adminApi as api } from "../utils/api.js";
import {
  PageHeader,
  PanelCard,
  Field,
  FormActions,
  PrimaryButton,
} from "./shared.jsx";

const DEFAULT_DAILY_OVERTIME_HOURS = 8;
const DEFAULT_WEEKLY_OVERTIME_HOURS = 38;

const initialForm = {
  dailyOvertimeHours: DEFAULT_DAILY_OVERTIME_HOURS,
  weeklyOvertimeHours: DEFAULT_WEEKLY_OVERTIME_HOURS,
  weekendPenalty: false,
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
      weekendPenalty: d.penalty?.weekend === 1,
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
        weekend: form.weekendPenalty ? 1 : 0,
        publicHoliday: form.publicHolidayPenalty ? 1 : 0,
      },
    };
    saveMutation.mutate(payload);
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
        <Field label="Daily Overtime Threshold (hours)">
          <TextField
            name="dailyOvertimeHours"
            type="number"
            value={form.dailyOvertimeHours}
            onChange={set}
            size="small"
            fullWidth
            inputProps={{ min: 0.01, step: 0.01 }}
          />
        </Field>
        <Field label="Weekly Overtime Threshold (hours)">
          <TextField
            name="weeklyOvertimeHours"
            type="number"
            value={form.weeklyOvertimeHours}
            onChange={set}
            size="small"
            fullWidth
            inputProps={{ min: 0.01, step: 0.01 }}
          />
        </Field>
        <Field label="Penalty Rules">
          <FormControlLabel
            control={
              <Checkbox
                name="weekendPenalty"
                checked={form.weekendPenalty}
                onChange={set}
              />
            }
            label="Weekend penalty"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="publicHolidayPenalty"
                checked={form.publicHolidayPenalty}
                onChange={set}
              />
            }
            label="Public holiday penalty"
          />
        </Field>
        <FormActions>
          <PrimaryButton type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </PrimaryButton>
        </FormActions>
      </PanelCard>
    </div>
  );
}
