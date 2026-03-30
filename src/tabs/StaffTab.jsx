import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    mutationFn: (payload) => api.post("/staff", payload),
    onSuccess: () => {
      showToast("Staff saved.");
      setForm(initialForm);
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to save staff"), true),
  });

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
          title="Create or Update Staff"
          component="form"
          onSubmit={handleSubmit}
        >
          {/* <Field label="Staff ID">
            <input name="id" value={form.id} onChange={set} readOnly />
          </Field> */}
          <Field label="Name">
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={set}
            />
          </Field>
          <Field label="Birthday">
            <input
              type="date"
              name="birthday"
              value={form.birthday}
              onChange={set}
            />
          </Field>
          <Field label="Sex">
            <select name="sex" value={form.sex} onChange={set}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Mobile Phone">
            <input
              name="mobilePhone"
              value={form.mobilePhone}
              onChange={set}
              pattern="^0\d{9}$"
              inputMode="numeric"
              title="Please enter a valid mobile number (e.g. 0400123456)"
            />
          </Field>

          <Field label="Email">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={set}
            />
          </Field>

          <Field label="Address">
            <input name="address" value={form.address} onChange={set} />
          </Field>

          <Field label="Post Code">
            <input
              name="postCode"
              value={form.postCode}
              onChange={set}
              pattern="\d{4}"
              inputMode="numeric"
              title="Please enter a 4-digit post code (e.g. 5000)"
            />
          </Field>
          <Field label="Type of Contract">
            <select
              name="contractType"
              required
              value={form.contractType}
              onChange={set}
            >
              <option value="">Select</option>
              <option>Casual</option>
              <option>Full Time</option>
              <option>Part Time</option>
            </select>
          </Field>
          <Field label="Role">
            <input name="role" type="text" value={form.role} onChange={set} />
          </Field>
          <Field label="Standard Rate">
            <input
              name="standardRate"
              type="number"
              min="0"
              step="0.01"
              value={form.standardRate}
              onChange={set}
            />
          </Field>
          <Field label="Overtime Rate">
            <input
              name="overtimeRate"
              type="number"
              min="0"
              step="0.01"
              value={form.overtimeRate}
              onChange={set}
            />
          </Field>
          <FormActions>
            <PrimaryButton type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Staff"}
            </PrimaryButton>

            <GhostButton type="button" onClick={() => setForm(initialForm)}>
              Clear
            </GhostButton>
          </FormActions>
        </PanelCard>

        <PanelCard title="Staff Directory">
          <InlineFields>
            <input
              type="text"
              placeholder="Search by name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearchKey(search)}
            />
            <PrimaryButton
              onClick={() => setSearchKey(search)}
              disabled={isFetching}
            >
              {isFetching ? "Loading..." : "Refresh"}
            </PrimaryButton>
          </InlineFields>
          <DataTable rows={staffRows} />
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
