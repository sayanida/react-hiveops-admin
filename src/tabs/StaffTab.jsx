import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import add24Filled from "@iconify-icons/fluent/add-24-filled";
import search24Filled from "@iconify-icons/fluent/search-24-filled";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Pagination,
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

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function createEmptyPatternRows() {
  return DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = { start: "", end: "" };
    return acc;
  }, {});
}

function parseTimeToMinutes(value) {
  if (!value || !value.includes(":")) return null;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function calculateDurationHours(start, end) {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin == null || endMin == null) return 0;
  let diff = endMin - startMin;
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

function buildPatternSchedule(patternRows) {
  const rows = DAYS_OF_WEEK.map((day) => {
    const start = patternRows[day]?.start || "";
    const end = patternRows[day]?.end || "";
    const duration = Number(calculateDurationHours(start, end).toFixed(2));
    return { day, start, end, duration };
  }).filter((row) => row.start && row.end);

  return rows.length > 0 ? JSON.stringify(rows) : "";
}

function parsePatternSchedule(schedulePattern) {
  const empty = createEmptyPatternRows();
  if (!schedulePattern) return empty;

  try {
    const parsed = JSON.parse(schedulePattern);
    if (!Array.isArray(parsed)) return empty;

    const next = { ...empty };
    parsed.forEach((row) => {
      const day = row?.day;
      if (!day || !next[day]) return;
      next[day] = {
        start: row?.start || "",
        end: row?.end || "",
      };
    });

    return next;
  } catch {
    return empty;
  }
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

  // Temporarily disabled: weekly/patterned standard-hours validation.

  return "";
}

export default function StaffTab({ showToast }) {
  const qc = useQueryClient();
  const rowsPerPage = 10;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patternRows, setPatternRows] = useState(() =>
    createEmptyPatternRows(),
  );

  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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

  const tableRows = filteredRows.map((row) => ({
    ID: row.id ?? "",
    Name: row.name ?? "",
    "Date of Birth": row.birthday ?? "",
    Gender: row.sex ?? "",
    Postcode: row.postCode ?? "",
    Role: row.role ?? "",
    "Std Rate": row.standardRate ?? "",
    "OT Rate": row.overtimeRate ?? "",
  }));

  const pageCount = Math.max(1, Math.ceil(tableRows.length / rowsPerPage));
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pagedTableRows = tableRows.slice(start, end);
  const pagedStaffRows = filteredRows.slice(start, end);

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
    setPatternRows(
      rowHoursType === "PATTERNED"
        ? parsePatternSchedule(String(rowSchedulePattern || ""))
        : createEmptyPatternRows(),
    );
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setPatternRows(createEmptyPatternRows());
  };

  const setPatternCell = (day, key, value) => {
    setPatternRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [key]: value,
      },
    }));
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
      weeklyHours: null,
      schedulePattern: null,
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
                  <Icon icon={search24Filled} width={18} />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="contained"
              color="primary"
              startIcon={<Icon icon={add24Filled} width={20} />}
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
          renderRowActions={(_, i) => (
            <GhostButton
              type="button"
              onClick={() => startEdit(pagedStaffRows[i])}
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
          <Box component="form" id="staff-record-form" onSubmit={handleSubmit}>
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
              {editingId ? (
                <Field label="Staff ID">
                  <TextField
                    name="id"
                    value={form.id}
                    size="small"
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Field>
              ) : null}
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
                  <MenuItem value="CASUAL">Casual</MenuItem>
                  <MenuItem value="FULL_TIME">Full Time</MenuItem>
                  <MenuItem value="PART_TIME">Part Time</MenuItem>
                </TextField>
              </Field>
              <Field label="Role">
                <TextField
                  select
                  name="role"
                  type="text"
                  required
                  value={form.role}
                  onChange={set}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="OFFICE_ADMIN">Office Admin</MenuItem>
                  <MenuItem value="ROSTER_ADMIN">Roster Admin</MenuItem>
                  <MenuItem value="MANAGER_SUPERVISOR">
                    Manager/Supervisor
                  </MenuItem>
                  <MenuItem value="WORKER">Worker</MenuItem>
                </TextField>
              </Field>
            </Box>
            {/* <Box
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                mt: 2,
                pt: 2,
              }}
            >
              <Typography variant="h7" sx={{ mb: 0.5, fontWeight: 600 }}>
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
              <Typography variant="h7" sx={{ mb: 0.75, fontWeight: 600 }}>
                Standard Hours
              </Typography>

              <RadioGroup
                row
                name="hoursType"
                value={form.hoursType}
                onChange={set}
              >
                <FormControlLabel
                  value="WEEKLY"
                  control={<Radio size="small" />}
                  label="Weekly Hours"
                />
                <FormControlLabel
                  value="PATTERNED"
                  control={<Radio size="small" />}
                  label="Patterned"
                />
              </RadioGroup>

              {form.hoursType === "WEEKLY" ? (
                <Field label="Weekly Total Hours">
                  <TextField
                    name="weeklyHours"
                    type="number"
                    value={form.weeklyHours}
                    onChange={set}
                    size="small"
                    fullWidth
                    inputProps={{ min: 0 }}
                    helperText="e.g. 38"
                  />
                </Field>
              ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Day</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Start Time
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>End Time</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Duration (hrs)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {DAYS_OF_WEEK.map((day) => {
                        const startTime = patternRows[day]?.start || "";
                        const endTime = patternRows[day]?.end || "";
                        const duration = calculateDurationHours(
                          startTime,
                          endTime,
                        );
                        return (
                          <TableRow key={day}>
                            <TableCell>{day}</TableCell>
                            <TableCell>
                              <TextField
                                type="time"
                                size="small"
                                value={startTime}
                                onChange={(e) =>
                                  setPatternCell(day, "start", e.target.value)
                                }
                                InputLabelProps={{ shrink: true }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="time"
                                size="small"
                                value={endTime}
                                onChange={(e) =>
                                  setPatternCell(day, "end", e.target.value)
                                }
                                InputLabelProps={{ shrink: true }}
                              />
                            </TableCell>
                            <TableCell>{duration.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box> */}

            {/* <Box
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                mt: 2,
                pt: 2,
              }}
            > */}
            {/* <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
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
              </Box> */}
            {/* </Box> */}
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
