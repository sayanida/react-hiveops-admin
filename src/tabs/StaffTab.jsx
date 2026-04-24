import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import SearchIcon from "@mui/icons-material/Search";
import { adminApi as api } from "../utils/api.js";
import {
  normalizeList,
  DataTable,
  Field,
  errMsg,
  GhostButton,
  PageHeader,
  PanelCard,
  PrimaryButton,
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
  weeklyHours: "38",
  schedulePattern: "",
};

// const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const MOBILE_RE = /^\d{8,}$/;
// const POST_CODE_RE = /^\d{4}$/;
// const BIRTHDAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const SEX_TO_API = {
  Male: "MALE",
  Female: "FEMALE",
  Other: "OTHER",
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
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
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
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
  const errors = {};

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }
  if (!values.contractType) {
    errors.contractType = "Please select a contract type.";
  }
  if (!values.role.trim()) {
    errors.role = "Role is required.";
  }

  if (values.standardRate.trim() === "") {
    errors.standardRate = "Standard rate is required.";
  }
  if (values.overtimeRate.trim() === "") {
    errors.overtimeRate = "Overtime rate is required.";
  }

  // if (values.email && !EMAIL_RE.test(values.email.trim())) {
  //   return "Invalid email format.";
  // }

  // if (values.mobilePhone && !MOBILE_RE.test(values.mobilePhone.trim())) {
  //   return "Invalid mobile phone number format.";
  // }

  // if (values.postCode && !POST_CODE_RE.test(values.postCode.trim())) {
  //   return "Post code must be a 4-digit number.";
  // }

  // if (values.birthday) {
  //   if (!BIRTHDAY_RE.test(values.birthday.trim())) {
  //     return "Birthday must be in YYYY-MM-DD format.";
  //   }
  //   const birthday = new Date(values.birthday);
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   if (birthday > today) {
  //     return "Birthday cannot be a future date.";
  //   }
  // }

  for (const key of ["standardRate", "overtimeRate"]) {
    if (values[key].trim() === "") continue;
    const num = Number(values[key]);
    if (Number.isNaN(num) || num < 0) {
      errors[key] = "Must be a number greater than or equal to 0.";
    }
  }

  const hasWeekly = values.weeklyHours.trim() !== "";
  const hasPattern = values.schedulePattern.trim() !== "";

  if (hasWeekly && hasPattern) {
    errors.weeklyHours = "Provide either weekly hours OR schedule pattern.";
    errors.schedulePattern = "Provide either schedule pattern OR weekly hours.";
  }
  if (!hasWeekly && !hasPattern) {
    errors.weeklyHours = "Either weekly hours or schedule pattern is required.";
    errors.schedulePattern =
      "Either weekly hours or schedule pattern is required.";
  }

  if (hasWeekly) {
    const weeklyHours = Number(values.weeklyHours);
    if (Number.isNaN(weeklyHours) || weeklyHours <= 0) {
      errors.weeklyHours = "Weekly hours must be a number greater than 0.";
    }
  }

  return errors;
}

export default function StaffTab({ showToast }) {
  const qc = useQueryClient();
  const rowsPerPage = 10;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;

    setForm((f) => {
      if (name === "weeklyHours") {
        return {
          ...f,
          weeklyHours: value,
          schedulePattern: value.trim() ? "" : f.schedulePattern,
        };
      }

      if (name === "schedulePattern") {
        return {
          ...f,
          schedulePattern: value,
          weeklyHours: value.trim() ? "" : f.weeklyHours,
        };
      }

      return { ...f, [name]: value };
    });

    setFieldErrors((prev) => {
      if (!prev[name] && name !== "weeklyHours" && name !== "schedulePattern") {
        return prev;
      }

      const next = { ...prev };
      delete next[name];
      if (name === "weeklyHours") delete next.schedulePattern;
      if (name === "schedulePattern") delete next.weeklyHours;
      return next;
    });
  };

  // ── List query (load once and filter on client by name or id)
  const { data: staffRows = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () =>
      api
        .get("/staff")
        .then((r) =>
          normalizeList(r.data).map((row) => normalizeStaffRowForTable(row)),
        ),
  });

  const keyword = search.trim().toLowerCase();
  const filteredRows = keyword
    ? staffRows.filter((row) => {
        const idText = String(row.id ?? "").toLowerCase();
        const nameText = String(row.name ?? "").toLowerCase();
        return idText.includes(keyword) || nameText.includes(keyword);
      })
    : staffRows;

  const filteredStaffById = new Map(
    filteredRows.map((row) => [String(row.id ?? ""), row]),
  );

  const tableRows = filteredRows.map((row) => ({
    ID: row.id ?? "",
    Name: row.name ?? "",
    // "Date of Birth": row.birthday ?? "",
    // Gender: row.sex ?? "",
    // Postcode: row.postCode ?? "",
    Role: row.role ?? "",
    "Std Rate": row.standardRate ?? "",
    "OT Rate": row.overtimeRate ?? "",
  }));

  const pageCount = Math.max(1, Math.ceil(tableRows.length / rowsPerPage));
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pagedTableRows = tableRows.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

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
      setFieldErrors({});
      setEditingId(null);
      setIsDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to save staff"), true),
  });

  const startEdit = (row) => {
    const rowId = row.id ?? row.staffId ?? "";
    const rowWeeklyHours = row.weeklyHours ?? row.weekly_hours;
    const rowSchedulePattern =
      row.schedulePattern ?? row.schedule_pattern ?? "";
    setEditingId(rowId || null);
    setFieldErrors({});
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
      weeklyHours: rowWeeklyHours != null ? String(rowWeeklyHours) : "",
      schedulePattern: rowSchedulePattern ? String(rowSchedulePattern) : "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setForm(initialForm);
    setFieldErrors({});
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateStaffForm(form);
    setFieldErrors(validationErrors);
    const firstError = Object.values(validationErrors)[0];
    if (firstError) {
      showToast(firstError, true);
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
    const weeklyHoursRaw = form.weeklyHours.trim();
    const schedulePatternRaw = form.schedulePattern.trim();

    const hasWeekly = weeklyHoursRaw !== "";
    const hasPattern = schedulePatternRaw !== "";

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
      weeklyHours: hasWeekly ? Number(weeklyHoursRaw) : null,
      schedulePattern: hasPattern ? schedulePatternRaw : null,
    };

    saveMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="Staff Administration"
        description="Manage staff records."
      />
      <PanelCard>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            mb: 1.5,
            flexWrap: "wrap",
          }}
        >
          <TextField
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: "260px" }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              sx={{ textTransform: "none" }}
            >
              Create a New Record
            </Button>
          </Box>
        </Box>
        <DataTable
          rows={pagedTableRows}
          actionsHeader=""
          renderRowActions={(tableRow) => (
            <GhostButton
              type="button"
              onClick={() => {
                const selected = filteredStaffById.get(
                  String(tableRow.ID ?? ""),
                );
                if (selected) startEdit(selected);
              }}
            >
              Edit
            </GhostButton>
          )}
        />
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      </PanelCard>

      <Dialog open={isDialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {editingId ? "Edit Staff Record" : "Create Staff Record"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            id="staff-record-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Field label="Staff ID">
                <TextField
                  name="id"
                  value={editingId ? form.id : ""}
                  size="small"
                  fullWidth
                  placeholder={
                    editingId ? "" : "Will be auto-assigned by the system"
                  }
                  disabled
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  helperText={
                    editingId
                      ? "Staff ID is locked and cannot be changed."
                      : "Staff ID is assigned automatically when you save a new record."
                  }
                />
              </Field>
              <Field label="Name">
                <TextField
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleFieldChange}
                  size="small"
                  fullWidth
                  error={Boolean(fieldErrors.name)}
                  helperText={fieldErrors.name || " "}
                />
              </Field>

              <Field label="Type of Contract">
                <TextField
                  select
                  name="contractType"
                  value={form.contractType}
                  onChange={handleFieldChange}
                  size="small"
                  fullWidth
                  error={Boolean(fieldErrors.contractType)}
                  helperText={fieldErrors.contractType || " "}
                >
                  <MenuItem value="CASUAL">Casual</MenuItem>
                  <MenuItem value="FULL_TIME">Full Time</MenuItem>
                  <MenuItem value="PART_TIME">Part Time</MenuItem>
                </TextField>
              </Field>
              <Field label="Role">
                <TextField
                  name="role"
                  type="text"
                  value={form.role}
                  onChange={handleFieldChange}
                  size="small"
                  fullWidth
                  placeholder="e.g. Supervisor"
                  error={Boolean(fieldErrors.role)}
                  helperText={fieldErrors.role || " "}
                />
              </Field>
            </Box>
            <Box
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                mt: 2,
                pt: 2,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Pay Rates
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <Field label="Standard Rate">
                  <TextField
                    name="standardRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.standardRate}
                    onChange={handleFieldChange}
                    size="small"
                    fullWidth
                    error={Boolean(fieldErrors.standardRate)}
                    helperText={fieldErrors.standardRate || " "}
                  />
                </Field>
                <Field label="Overtime Rate">
                  <TextField
                    name="overtimeRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.overtimeRate}
                    onChange={handleFieldChange}
                    size="small"
                    fullWidth
                    error={Boolean(fieldErrors.overtimeRate)}
                    helperText={fieldErrors.overtimeRate || " "}
                  />
                </Field>
              </Box>
            </Box>

            <Box
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                mt: 2,
                pt: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ mb: 0.75, fontWeight: 600 }}
              >
                Standard Hours
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <Field label="Weekly Total Hours">
                  <TextField
                    name="weeklyHours"
                    type="number"
                    value={form.weeklyHours}
                    onChange={handleFieldChange}
                    size="small"
                    fullWidth
                    inputProps={{ min: 0, step: 0.1 }}
                    error={Boolean(fieldErrors.weeklyHours)}
                    helperText={
                      fieldErrors.weeklyHours ||
                      "Provide this OR schedule pattern"
                    }
                  />
                </Field>
                <Field label="Schedule Pattern">
                  <TextField
                    name="schedulePattern"
                    value={form.schedulePattern}
                    onChange={handleFieldChange}
                    size="small"
                    fullWidth
                    placeholder="e.g. Mon-Fri 9-5"
                    error={Boolean(fieldErrors.schedulePattern)}
                    helperText={
                      fieldErrors.schedulePattern ||
                      "Provide this OR weekly hours"
                    }
                  />
                </Field>
              </Box>
            </Box>

            {/*
            <Box
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                mt: 2,
                pt: 2,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Optional Details
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
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
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
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
                <Field label="Address">
                  <TextField
                    name="address"
                    value={form.address}
                    onChange={set}
                    size="small"
                    fullWidth
                  />
                </Field>
              </Box>
            </Box>
            */}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <GhostButton type="button" onClick={closeDialog}>
            Cancel
          </GhostButton>
          <PrimaryButton
            type="submit"
            form="staff-record-form"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? editingId
                ? "Updating..."
                : "Saving..."
              : editingId
                ? "Update Staff"
                : "Save Staff"}
          </PrimaryButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
