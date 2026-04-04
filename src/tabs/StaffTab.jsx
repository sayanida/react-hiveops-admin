import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MenuItem, TextField } from "@mui/material";
import { adminApi as api } from "../utils/api.js";
import {
  normalizeList,
  DataTable,
  Field,
  errMsg,
  FormActions,
  GhostButton,
  InlineFields,
  PageHeader,
  PanelCard,
  PrimaryButton,
  TwoColumn,
} from "./shared.jsx";

const initialForm = {
  id: "",
  name: "",
  birthday: "",
  sex: "",
  mobilePhone: "",
  email: "",
  address: "",
  postCode: "",
  contractType: "",
  role: "",
  standardRate: "",
  overtimeRate: "",
  hoursType: "WEEKLY", // "WEEKLY" | "PATTERNED"
  weeklyHours: "",
  schedulePattern: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^\d{8,}$/;
const POST_CODE_RE = /^\d{4}$/;

const SEX_TO_API = {
  Male: "MALE",
  Female: "FEMALE",
  Other: "OTHER",
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
};

const CONTRACT_TO_API = {
  Casual: "CASUAL",
  "Full Time": "FULL_TIME",
  "Part Time": "PART_TIME",
  CASUAL: "CASUAL",
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
};

const SEX_TO_FORM = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
  Male: "MALE",
  Female: "FEMALE",
  Other: "OTHER",
};

const CONTRACT_TO_FORM = {
  CASUAL: "CASUAL",
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  Casual: "CASUAL",
  "Full Time": "FULL_TIME",
  "Part Time": "PART_TIME",
};

function normalizeStaffRowForTable(row) {
  return {
    id: row.id ?? row.staffId ?? "",
    name: row.name ?? "",
    birthday: row.birthday ?? "",
    sex: row.sex ?? "",
    mobilePhone: row.mobilePhone ?? row.mobile_phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    postCode: row.postCode ?? row.post_code ?? "",
    contractType: row.contractType ?? row.contract_type ?? "",
    role: row.role ?? "",
    standardRate: row.standardRate ?? row.standard_rate ?? "",
    overtimeRate: row.overtimeRate ?? row.overtime_rate ?? "",
    weeklyHours: row.weeklyHours ?? row.weekly_hours ?? null,
    schedulePattern: row.schedulePattern ?? row.schedule_pattern ?? null,
  };
}

function validateStaffForm(values) {
  if (!values.name.trim()) return "Name is required.";
  if (!values.contractType) return "Please select a contract type.";
  if (!values.role.trim()) return "Role is required.";

  if (values.standardRate.trim() === "") {
    return "Standard rate is required.";
  }
  if (values.overtimeRate.trim() === "") {
    return "Overtime rate is required.";
  }

  if (values.email && !EMAIL_RE.test(values.email.trim())) {
    return "Invalid email format.";
  }

  if (values.mobilePhone && !MOBILE_RE.test(values.mobilePhone.trim())) {
    return "Invalid mobile phone number format.";
  }

  if (values.postCode && !POST_CODE_RE.test(values.postCode.trim())) {
    return "Post code must be a 4-digit number.";
  }

  if (values.birthday) {
    const birthday = new Date(values.birthday);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (birthday > today) {
      return "Birthday cannot be a future date.";
    }
  }

  // for (const key of ["standardRate", "overtimeRate"]) {
  //   const num = Number(values[key]);
  //   if (Number.isNaN(num) || num < 0) {
  //     return "Hourly rate must be a number greater than or equal to 0.";
  //   }
  // }

  const hasWeekly = values.weeklyHours !== "";
  const hasPattern = values.schedulePattern.trim() !== "";

  if (hasWeekly && hasPattern) {
    return "Provide either weekly hours or schedule pattern, not both.";
  }

  if (!hasWeekly && !hasPattern) {
    return "Either weekly hours or schedule pattern is required.";
  }

  if (hasWeekly) {
    const weeklyHours = Number(values.weeklyHours);
    if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) {
      return "Weekly hours must be greater than 0.";
    }
  }

  return "";
}

export default function StaffTab({ showToast }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ── List query (only fires after first manual load, then re-fetches on key change)
  const [searchKey, setSearchKey] = useState(null);
  const { data: staffRows = [], isFetching } = useQuery({
    queryKey: ["staff", searchKey],
    queryFn: () =>
      api
        .get(
          `/staff${searchKey ? `?search=${encodeURIComponent(searchKey)}` : ""}`,
        )
        .then((r) =>
          normalizeList(r.data).map((row) => normalizeStaffRowForTable(row)),
        ),
    enabled: searchKey !== null,
  });

  // ── Save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const id = payload.id;

      if (!id) {
        return api.post("/staff/save", payload);
      }

      try {
        // Keep compatibility with backend save endpoint.
        return await api.post("/staff/save", payload);
      } catch (err) {
        const status = err?.response?.status;
        const raw = err?.response?.data;
        const detail =
          typeof raw === "string"
            ? raw
            : JSON.stringify(raw || {}) + (err?.message || "");

        // json-server rewrite handles POST as insert only. - FE Mock test only!!
        if (status === 500 && /duplicate id|insert failed/i.test(detail)) {
          return api.put(`/staff/${id}`, payload);
        }

        throw err;
      }
    },
    onSuccess: () => {
      showToast(editingId ? "Staff updated." : "Staff saved.");
      setForm(initialForm);
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to save staff"), true),
  });

  const startEdit = (row) => {
    const rowId = row.id ?? row.staffId ?? "";
    const rowWeeklyHours = row.weeklyHours ?? row.weekly_hours;
    const rowSchedulePattern =
      row.schedulePattern ?? row.schedule_pattern ?? "";
    const rowHoursType = rowSchedulePattern ? "PATTERNED" : "WEEKLY";
    setEditingId(rowId || null);
    setForm({
      id: String(rowId || ""),
      name: row.name ?? "",
      birthday: row.birthday ?? "",
      sex: SEX_TO_FORM[row.sex] ?? "",
      mobilePhone: row.mobilePhone ?? row.mobile_phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
      postCode: row.postCode ?? row.post_code ?? "",
      contractType:
        CONTRACT_TO_FORM[row.contractType ?? row.contract_type] ?? "",
      role: row.role ?? "",
      standardRate: String(row.standardRate ?? row.standard_rate ?? ""),
      overtimeRate: String(row.overtimeRate ?? row.overtime_rate ?? ""),
      hoursType: rowHoursType,
      weeklyHours:
        rowHoursType === "WEEKLY" && rowWeeklyHours != null
          ? String(rowWeeklyHours)
          : "",
      schedulePattern:
        rowHoursType === "PATTERNED" ? String(rowSchedulePattern) : "",
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateStaffForm(form);
    if (validationError) {
      showToast(validationError, true);
      return;
    }

    const trimmedId = form.id.trim();
    const name = form.name.trim();
    const role = form.role.trim();
    const contractType = CONTRACT_TO_API[form.contractType.trim()] || "";
    const standardRate = Number(form.standardRate.trim());
    const overtimeRate = Number(form.overtimeRate.trim());
    const birthday = form.birthday.trim();
    const sex = SEX_TO_API[form.sex.trim()] || "";
    const mobilePhone = form.mobilePhone.trim();
    const email = form.email.trim();
    const address = form.address.trim();
    const postCode = form.postCode.trim();
    const weeklyHours = form.weeklyHours.trim();
    const schedulePattern = form.schedulePattern.trim();
    const hasWeekly = weeklyHours !== "";
    const hasPattern = schedulePattern !== "";

    const payload = {
      ...(trimmedId ? { id: Number(trimmedId) } : {}),
      name,
      role,
      contractType,
      standardRate,
      overtimeRate,
      ...(birthday ? { birthday } : {}),
      ...(sex ? { sex } : {}),
      ...(mobilePhone ? { mobilePhone } : {}),
      ...(email ? { email } : {}),
      ...(address ? { address } : {}),
      ...(postCode ? { postCode } : {}),
      ...(hasWeekly
        ? { weeklyHours: Number(weeklyHours), schedulePattern: null }
        : { weeklyHours: null, schedulePattern }),
    };

    saveMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="Staff Setup"
        description="Manage staff profiles, contracts, and pay rates."
      />
      <TwoColumn>
        <PanelCard
          title={editingId ? "Edit Staff" : "Create or Update Staff"}
          component="form"
          onSubmit={handleSubmit}
        >
          {/* Since the ID can’t be edited, I don’t think we need to show it when creating or updating. */}
          {/* <Field label="ID">
            <TextField
              name="id"
              value={form.id}
              size="small"
              fullWidth
              disabled
            />
          </Field> */}
          <Field label="Name">
            <TextField
              name="name"
              type="text"
              required
              value={form.name}
              onChange={set}
              size="small"
              fullWidth
            />
          </Field>
          <Field label="Birthday">
            <TextField
              type="date"
              name="birthday"
              value={form.birthday}
              onChange={set}
              size="small"
              fullWidth
            />
          </Field>
          <Field label="Sex">
            <TextField
              select
              name="sex"
              value={form.sex}
              onChange={set}
              size="small"
              fullWidth
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>
          </Field>
          <Field label="Mobile Phone">
            <TextField
              name="mobilePhone"
              value={form.mobilePhone}
              onChange={set}
              pattern="^\d{8,}$"
              inputMode="numeric"
              title="Please enter valid mobile phone number (e.g. 0412345678)"
              size="small"
              fullWidth
            />
          </Field>

          <Field label="Email">
            <TextField
              name="email"
              type="email"
              value={form.email}
              onChange={set}
              size="small"
              fullWidth
            />
          </Field>

          <Field label="Address">
            <TextField
              name="address"
              value={form.address}
              onChange={set}
              size="small"
              fullWidth
            />
          </Field>

          <Field label="Post Code">
            <TextField
              name="postCode"
              value={form.postCode}
              onChange={set}
              pattern="\d{4}"
              inputMode="numeric"
              title="Please enter a 4-digit post code (e.g. 5000)"
              size="small"
              fullWidth
            />
          </Field>
          <Field label="Type of Contract">
            <TextField
              select
              name="contractType"
              required
              value={form.contractType}
              onChange={set}
              size="small"
              fullWidth
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="CASUAL">Casual</MenuItem>
              <MenuItem value="FULL_TIME">Full Time</MenuItem>
              <MenuItem value="PART_TIME">Part Time</MenuItem>
            </TextField>
          </Field>
          <Field label="Role">
            <TextField
              name="role"
              type="text"
              required
              value={form.role}
              onChange={set}
              size="small"
              fullWidth
            />
          </Field>

          {/* ───── Standard Working Hours ───── */}
          <Field label="Standard Working Hours">
            {/* Radio: Weekly / Patterned */}
            <TextField
              select
              name="hoursType"
              value={form.hoursType}
              onChange={set}
              size="small"
              fullWidth
            >
              <MenuItem value="WEEKLY">Weekly total hours</MenuItem>
              <MenuItem value="PATTERNED">Patterned schedule</MenuItem>
            </TextField>

            {/* Conditional input */}
            {form.hoursType === "WEEKLY" && (
              <TextField
                sx={{ mt: 1 }}
                name="weeklyHours"
                type="number"
                label="Hours per week"
                value={form.weeklyHours}
                onChange={set}
                size="small"
                fullWidth
                inputProps={{ min: 0 }}
                helperText="e.g. 38"
              />
            )}

            {form.hoursType === "PATTERNED" && (
              <TextField
                sx={{ mt: 1 }}
                name="schedulePattern"
                label="Schedule pattern"
                value={form.schedulePattern}
                onChange={set}
                size="small"
                fullWidth
                helperText="e.g. Mon–Fri 9–5"
              />
            )}
          </Field>

          <Field label="Standard Rate">
            <TextField
              name="standardRate"
              type="number"
              min="0"
              step="0.01"
              value={form.standardRate}
              onChange={set}
              size="small"
              fullWidth
            />
          </Field>
          <Field label="Overtime Rate">
            <TextField
              name="overtimeRate"
              type="number"
              min="0"
              step="0.01"
              value={form.overtimeRate}
              onChange={set}
              size="small"
              fullWidth
            />
          </Field>
          <FormActions>
            <PrimaryButton type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                  ? "Update Staff"
                  : "Save Staff"}
            </PrimaryButton>

            <GhostButton type="button" onClick={resetForm}>
              {editingId ? "Cancel Edit" : "Clear"}
            </GhostButton>
          </FormActions>
        </PanelCard>

        <PanelCard title="Staff Directory">
          <InlineFields>
            <TextField
              placeholder="Search by name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearchKey(search)}
              size="small"
            />
            <PrimaryButton
              onClick={() => setSearchKey(search)}
              disabled={isFetching}
            >
              {isFetching ? "Loading..." : "Refresh"}
            </PrimaryButton>
          </InlineFields>
          <DataTable
            rows={staffRows}
            renderRowActions={(row) => (
              <GhostButton type="button" onClick={() => startEdit(row)}>
                Edit
              </GhostButton>
            )}
          />
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
