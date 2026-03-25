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

export default function StaffTab({ showToast }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    staffId: "",
    name: "",
    contractType: "",
    standardHours: "",
    role: "",
    standardRate: "",
    overtimeRate: "",
  });

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
      setForm({
        staffId: "",
        name: "",
        contractType: "",
        standardHours: "",
        role: "",
        standardRate: "",
        overtimeRate: "",
      });
      qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to save staff"), true),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
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
          <Field label="Staff ID Number">
            <input
              name="staffId"
              type="text"
              required
              value={form.staffId}
              onChange={set}
            />
          </Field>
          <Field label="Name">
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={set}
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
          <Field label="Standard Hours">
            <input
              name="standardHours"
              type="number"
              min="0"
              step="0.25"
              value={form.standardHours}
              onChange={set}
            />
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
            <GhostButton
              type="button"
              onClick={() =>
                setForm({
                  staffId: "",
                  name: "",
                  contractType: "",
                  standardHours: "",
                  role: "",
                  standardRate: "",
                  overtimeRate: "",
                })
              }
            >
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
