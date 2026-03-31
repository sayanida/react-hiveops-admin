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
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^0\d{9}$/;
const POST_CODE_RE = /^\d{4}$/;

function validateStaffForm(values) {
  if (!values.name.trim()) return "Name is required.";
  if (!values.contractType) return "Please select a contract type.";
  if (!values.role.trim()) return "Role is required.";

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

  for (const key of ["standardRate", "overtimeRate"]) {
    if (!values[key]) continue;
    const num = Number(values[key]);
    if (Number.isNaN(num) || num < 0) {
      return "Hourly rate must be a number greater than or equal to 0.";
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
        .then((r) => normalizeList(r.data)),
    enabled: searchKey !== null,
  });

  // ── Save mutation
  const saveMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id
        ? api.patch(`/staff/${encodeURIComponent(id)}`, payload)
        : api.post("/staff", payload),
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
    setEditingId(rowId || null);
    setForm({
      id: String(rowId || ""),
      name: row.name ?? "",
      birthday: row.birthday ?? "",
      sex: row.sex ?? "",
      mobilePhone: row.mobilePhone ?? row.mobile_phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
      postCode: row.postCode ?? row.post_code ?? "",
      contractType: row.contractType ?? row.contract_type ?? "",
      role: row.role ?? "",
      standardRate: String(row.standardRate ?? row.standard_rate ?? ""),
      overtimeRate: String(row.overtimeRate ?? row.overtime_rate ?? ""),
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

    const payload = {
      ...form,
      name: form.name.trim(),
      birthday: form.birthday.trim(),
      mobilePhone: form.mobilePhone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      postCode: form.postCode.trim(),
      role: form.role.trim(),
    };

    saveMutation.mutate({ id: editingId || form.id || null, payload });
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
              pattern="^0\d{9}$"
              inputMode="numeric"
              title="Please enter a valid mobile number (e.g. 0400123456)"
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
              <MenuItem value="Casual">Casual</MenuItem>
              <MenuItem value="Full Time">Full Time</MenuItem>
              <MenuItem value="Part Time">Part Time</MenuItem>
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
