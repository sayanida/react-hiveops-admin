import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  mockRegistrations,
  mockStaffRows,
} from "../mocks/staffAdminMockData.js";
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
  createSystemAccount: true,
  accountEmail: "",
  accountPassword: "",
  confirmAccountPassword: "",
  standardRate: "",
  overtimeRate: "",
  weeklyHours: "38",
  schedulePattern: "",
};

const ACCOUNT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const ROLE_LABELS = {
  OFFICE_ADMIN: "Office Admin",
  MANAGER: "Manager/Supervisor",
  SUPERVISOR: "Manager/Supervisor",
  ROSTER_ADMIN: "Roster Admin",
  WORKER: "Worker",
};

const ROLE_TO_FORM = {
  OFFICE_ADMIN: "OFFICE_ADMIN",
  ROSTER_ADMIN: "ROSTER_ADMIN",
  MANAGER: "MANAGER",
  SUPERVISOR: "MANAGER",
  WORKER: "WORKER",
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role ?? "";
}

function resolveStaffStatus(row) {
  const rawStatus = String(row.status ?? row.staffStatus ?? row.state ?? "")
    .trim()
    .toLowerCase();
  const activeFlag = row.isActive ?? row.active ?? row.enabled;
  const deactivatedAt = row.deactivatedAt ?? row.deactivated_at;

  if (rawStatus.includes("deactiv") || rawStatus.includes("inactive")) {
    return { label: "Deactivated", isActive: false };
  }

  if (rawStatus.includes("active")) {
    return { label: "Active", isActive: true };
  }

  if (typeof activeFlag === "boolean") {
    return activeFlag
      ? { label: "Active", isActive: true }
      : { label: "Deactivated", isActive: false };
  }

  if (deactivatedAt) {
    return { label: "Deactivated", isActive: false };
  }

  return { label: "Active", isActive: true };
}

function normalizeRegistration(row) {
  return {
    staffId: row.staffId ?? row.staff_id ?? row.staffID ?? null,
    method: row.method ?? row.type ?? row.identificationMethod ?? "Unknown",
    identifier: row.identifier ?? row.token ?? row.value ?? "-",
    reason: row.reason ?? "",
  };
}

const IDENT_METHOD_CATALOG = [
  {
    key: "webcam_face",
    label: "Webcam Face Mock",
    aliases: ["webcam face", "face", "facial recognition"],
    description: "Simulated facial recognition via webcam",
  },
  {
    key: "qr_pin",
    label: "QR / PIN",
    aliases: ["qr", "pin", "qr / pin", "qr code"],
    description: "QR code scan or 4-digit PIN at station",
  },
];

function getEmployeeCode(staffId) {
  const numeric = Number(staffId);
  if (Number.isNaN(numeric)) {
    return `EMP-${String(staffId ?? "").padStart(3, "0")}`;
  }
  return `EMP-${String(numeric).padStart(3, "0")}`;
}

function isMethodRegistered(registrationMethod, aliases) {
  const text = String(registrationMethod ?? "").toLowerCase();
  return aliases.some((alias) => text.includes(alias));
}

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
    status: row.status ?? row.staffStatus ?? row.state ?? "",
    staffStatus: row.staffStatus ?? "",
    state: row.state ?? "",
    isActive:
      typeof row.isActive === "boolean"
        ? row.isActive
        : typeof row.active === "boolean"
          ? row.active
          : typeof row.enabled === "boolean"
            ? row.enabled
            : undefined,
    deactivatedAt: row.deactivatedAt ?? row.deactivated_at ?? null,
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

  if (values.createSystemAccount) {
    if (!values.accountEmail.trim()) {
      errors.accountEmail = "Account email is required.";
    } else if (!ACCOUNT_EMAIL_RE.test(values.accountEmail.trim())) {
      errors.accountEmail = "Enter a valid account email address.";
    }

    if (!values.id && !values.accountPassword.trim()) {
      errors.accountPassword = "Password is required for new accounts.";
    }

    if (
      values.accountPassword.trim() ||
      values.confirmAccountPassword.trim() ||
      !values.id
    ) {
      if (!values.confirmAccountPassword.trim()) {
        errors.confirmAccountPassword = "Please confirm the password.";
      } else if (values.accountPassword !== values.confirmAccountPassword) {
        errors.confirmAccountPassword = "Passwords do not match.";
      }
    }
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
  const rowsPerPage = 10;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [staffRows, setStaffRows] = useState(() =>
    normalizeList(mockStaffRows).map((row) => normalizeStaffRowForTable(row)),
  );
  const [registrationRows] = useState(() =>
    normalizeList(mockRegistrations).map((row) => normalizeRegistration(row)),
  );
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStaffForStatus, setSelectedStaffForStatus] = useState(null);

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;

    setForm((f) => {
      if (name === "weeklyHours") {
        return {
          ...f,
          weeklyHours: nextValue,
          schedulePattern: String(nextValue).trim() ? "" : f.schedulePattern,
        };
      }

      if (name === "schedulePattern") {
        return {
          ...f,
          schedulePattern: nextValue,
          weeklyHours: String(nextValue).trim() ? "" : f.weeklyHours,
        };
      }

      if (name === "createSystemAccount") {
        return {
          ...f,
          createSystemAccount: Boolean(nextValue),
          accountPassword: "",
          confirmAccountPassword: "",
        };
      }

      return { ...f, [name]: nextValue };
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

  const selectedStaffId = selectedStaffForStatus?.id;
  const isStatusDialogOpen = Boolean(selectedStaffForStatus);
  const selectedStaffRegistrations = useMemo(() => {
    if (selectedStaffId == null) return [];
    return registrationRows.filter((item) => {
      const itemStaffId = item.staffId ?? item.staff_id ?? item.staffID;
      return String(itemStaffId) === String(selectedStaffId);
    });
  }, [registrationRows, selectedStaffId]);

  const isRegistrationsError = false;
  const methodCards = useMemo(
    () =>
      IDENT_METHOD_CATALOG.map((method) => {
        const matched = selectedStaffRegistrations.find((registration) =>
          isMethodRegistered(registration.method, method.aliases),
        );
        return {
          ...method,
          isRegistered: Boolean(matched),
          registeredIdentifier: matched?.identifier ?? "",
        };
      }),
    [selectedStaffRegistrations],
  );

  const isAccountActive = Boolean(selectedStaffForStatus?.isActive);
  const dialogTone = isAccountActive
    ? {
        titleBg: "#2e7d32",
        titleIcon: <CheckCircleOutlineIcon fontSize="small" />,
        accountLabel: "Active Account",
        cardBg: "#d8ecd9",
        cardBorder: "#95d29b",
        deactivatedCardBg: "#f3e1e5",
        deactivatedCardBorder: "#ec9ea8",
      }
    : {
        titleBg: "#d32f2f",
        titleIcon: <WarningAmberOutlinedIcon fontSize="small" />,
        accountLabel: "Deactivated Account",
        cardBg: "#f3e1e5",
        cardBorder: "#ec9ea8",
        deactivatedCardBg: "#f3e1e5",
        deactivatedCardBorder: "#ec9ea8",
      };

  const openStatusDialog = (row) => {
    const { label, isActive } = resolveStaffStatus(row);
    setSelectedStaffForStatus({
      id: row.id,
      name: row.name,
      role: row.role,
      statusLabel: label,
      isActive,
    });
  };

  const closeStatusDialog = () => {
    setSelectedStaffForStatus(null);
  };

  const toggleStaffActivation = () => {
    if (!selectedStaffForStatus) return;

    const nextIsActive = !selectedStaffForStatus.isActive;
    const nextStatusLabel = nextIsActive ? "Active" : "Deactivated";

    setStaffRows((prev) =>
      prev.map((row) => {
        if (String(row.id) !== String(selectedStaffForStatus.id)) {
          return row;
        }

        return {
          ...row,
          isActive: nextIsActive,
          status: nextIsActive ? "ACTIVE" : "DEACTIVATED",
          staffStatus: nextIsActive ? "ACTIVE" : "DEACTIVATED",
          state: nextIsActive ? "ACTIVE" : "DEACTIVATED",
          deactivatedAt: nextIsActive ? null : new Date().toISOString(),
        };
      }),
    );

    setSelectedStaffForStatus((prev) =>
      prev
        ? {
            ...prev,
            isActive: nextIsActive,
            statusLabel: nextStatusLabel,
          }
        : prev,
    );

    showToast(nextIsActive ? "Staff activated." : "Staff deactivated.");
  };

  const tableRows = filteredRows.map((row) => ({
    ID: row.id ?? "",
    Name: row.name ?? "",
    // "Date of Birth": row.birthday ?? "",
    // Gender: row.sex ?? "",
    // Postcode: row.postCode ?? "",
    Role: getRoleLabel(row.role),
    "Std Rate": row.standardRate ?? "",
    "OT Rate": row.overtimeRate ?? "",
    Status: (() => {
      const { label, isActive } = resolveStaffStatus(row);
      return (
        <Chip
          size="small"
          clickable
          label={label}
          color={isActive ? "success" : "default"}
          onClick={() => openStatusDialog(row)}
          sx={{ minWidth: 96 }}
        />
      );
    })(),
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
      if (!payload.id) {
        const maxId = staffRows.reduce(
          (max, row) => Math.max(max, Number(row.id) || 0),
          0,
        );
        return {
          mode: "create",
          row: {
            ...payload,
            id: maxId + 1,
            status: "ACTIVE",
            isActive: true,
            deactivatedAt: null,
          },
        };
      }

      const existing = staffRows.find(
        (row) => String(row.id) === String(payload.id),
      );

      return {
        mode: "update",
        row: {
          ...existing,
          ...payload,
        },
      };
    },
    onSuccess: (result) => {
      setStaffRows((prev) => {
        if (result.mode === "create") {
          return [...prev, normalizeStaffRowForTable(result.row)];
        }

        return prev.map((row) =>
          String(row.id) === String(result.row.id)
            ? normalizeStaffRowForTable(result.row)
            : row,
        );
      });

      showToast(editingId ? "Staff updated." : "Staff saved.");
      setForm(initialForm);
      setFieldErrors({});
      setEditingId(null);
      setIsDialogOpen(false);
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
      role: ROLE_TO_FORM[row.role] ?? row.role ?? "",
      createSystemAccount: Boolean(
        row.accountEmail ??
        row.accountUserName ??
        row.accountUsername ??
        row.loginEmail ??
        row.login_email ??
        row.email ??
        row.userName ??
        row.username,
      ),
      accountEmail:
        row.accountEmail ??
        row.accountUserName ??
        row.accountUsername ??
        row.loginEmail ??
        row.login_email ??
        row.email ??
        row.userName ??
        row.username ??
        "",
      accountPassword: "",
      confirmAccountPassword: "",
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
    const accountEmail = form.accountEmail.trim();
    const accountPassword = form.accountPassword.trim();

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
      ...(form.createSystemAccount
        ? {
            createSystemAccount: true,
            accountEmail,
            ...(accountPassword ? { accountPassword } : {}),
            systemAccount: {
              email: accountEmail,
              ...(accountPassword ? { password: accountPassword } : {}),
            },
          }
        : {}),
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
                  select
                  name="role"
                  value={form.role}
                  onChange={handleFieldChange}
                  size="small"
                  fullWidth
                  error={Boolean(fieldErrors.role)}
                  helperText={fieldErrors.role || " "}
                >
                  <MenuItem value="">Select role</MenuItem>
                  <MenuItem value="OFFICE_ADMIN">Office Admin</MenuItem>
                  <MenuItem value="MANAGER">Manager/Supervisor</MenuItem>
                  <MenuItem value="ROSTER_ADMIN">Roster Admin</MenuItem>
                  <MenuItem value="WORKER">Worker</MenuItem>
                </TextField>
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
                System Account
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    name="createSystemAccount"
                    checked={Boolean(form.createSystemAccount)}
                    onChange={handleFieldChange}
                  />
                }
                label="Create/maintain system account for this staff member"
              />

              {form.createSystemAccount ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 2,
                    mt: 0.5,
                  }}
                >
                  <Field label="Account Email">
                    <TextField
                      name="accountEmail"
                      type="email"
                      value={form.accountEmail}
                      onChange={handleFieldChange}
                      size="small"
                      fullWidth
                      error={Boolean(fieldErrors.accountEmail)}
                      helperText={fieldErrors.accountEmail || " "}
                    />
                  </Field>
                  <Field label="Account Password">
                    <TextField
                      name="accountPassword"
                      type="password"
                      value={form.accountPassword}
                      onChange={handleFieldChange}
                      size="small"
                      fullWidth
                      error={Boolean(fieldErrors.accountPassword)}
                      helperText={
                        fieldErrors.accountPassword ||
                        (editingId
                          ? "Leave blank to keep existing password"
                          : " ")
                      }
                    />
                  </Field>
                  <Field label="Confirm Password">
                    <TextField
                      name="confirmAccountPassword"
                      type="password"
                      value={form.confirmAccountPassword}
                      onChange={handleFieldChange}
                      size="small"
                      fullWidth
                      error={Boolean(fieldErrors.confirmAccountPassword)}
                      helperText={fieldErrors.confirmAccountPassword || " "}
                    />
                  </Field>
                </Box>
              ) : null}
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

      <Dialog
        open={isStatusDialogOpen}
        onClose={closeStatusDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: dialogTone.titleBg,
            color: "common.white",
            py: 1.75,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {dialogTone.titleIcon}
            <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
              {dialogTone.accountLabel}
            </Typography>
          </Box>
          <IconButton
            onClick={closeStatusDialog}
            sx={{ color: "common.white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.75 }}>
          {selectedStaffForStatus ? (
            <Box
              sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 0.5 }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, lineHeight: 1.2 }}
              >
                {selectedStaffForStatus.name || "Staff"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getEmployeeCode(selectedStaffForStatus.id)} -{" "}
                {getRoleLabel(selectedStaffForStatus.role) || "Worker"}
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              />
            </Box>
          ) : null}

          {isRegistrationsError ? (
            <Typography variant="body2" color="error.main">
              Failed to load identification methods.
            </Typography>
          ) : null}

          {!isRegistrationsError ? (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Registered Identification Methods
              </Typography>
              <List dense disablePadding>
                {methodCards.map((method) => (
                  <ListItem
                    key={method.key}
                    disablePadding
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      mb: 1.5,
                      alignItems: "flex-start",
                      border: "1px solid",
                      borderColor: method.isRegistered
                        ? dialogTone.cardBorder
                        : dialogTone.deactivatedCardBorder,
                      backgroundColor: method.isRegistered
                        ? dialogTone.cardBg
                        : dialogTone.deactivatedCardBg,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {method.label}
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              isAccountActive
                                ? method.isRegistered
                                  ? "Registered"
                                  : "Not Registered"
                                : "Deactivated"
                            }
                            color={
                              isAccountActive
                                ? method.isRegistered
                                  ? "success"
                                  : "default"
                                : "error"
                            }
                            variant={isAccountActive ? "filled" : "outlined"}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="span"
                          >
                            {method.description}
                          </Typography>
                          {method.isRegistered &&
                          method.registeredIdentifier ? (
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                              sx={{ mt: 0.25 }}
                            >
                              ID: {method.registeredIdentifier}
                            </Typography>
                          ) : null}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
          <Button
            type="button"
            variant="outlined"
            color={isAccountActive ? "error" : "success"}
            onClick={toggleStaffActivation}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              minWidth: 170,
              backgroundColor: isAccountActive
                ? "rgba(211, 47, 47, 0.08)"
                : "rgba(46, 125, 50, 0.08)",
            }}
          >
            {isAccountActive ? "Deactivate Staff" : "Reactivate Staff"}
          </Button>
          <GhostButton
            type="button"
            onClick={closeStatusDialog}
            sx={{ minWidth: 120 }}
          >
            Close
          </GhostButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
