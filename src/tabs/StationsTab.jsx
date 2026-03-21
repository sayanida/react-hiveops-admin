import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi as api } from "../utils/api.js";
import {
  normalizeList,
  DataTable,
  Field,
  errMsg,
  FormActions,
  PageHeader,
  PanelCard,
  PrimaryButton,
  TwoColumn,
} from "./shared.jsx";

export default function StationsTab({ showToast }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", location: "", type: "" });
  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const {
    data: stationRows = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["stations"],
    queryFn: () => api.get("/stations").then((r) => normalizeList(r.data)),
    enabled: false, // manual trigger only
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => api.post("/stations", payload),
    onSuccess: () => {
      showToast("Station saved.");
      setForm({ name: "", location: "", type: "" });
      qc.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to save station"), true),
  });

  return (
    <div>
      <PageHeader
        title="Clocking Stations"
        description="Manage biometric and card stations used for clocking in and out."
      />
      <TwoColumn>
        <PanelCard
          title="Add Station"
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
        >
          <Field label="Name">
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={set}
            />
          </Field>
          <Field label="Location">
            <input
              name="location"
              type="text"
              required
              value={form.location}
              onChange={set}
            />
          </Field>
          <Field label="Type">
            <select name="type" required value={form.type} onChange={set}>
              <option value="">Select</option>
              <option>Card</option>
              <option>Face</option>
              <option>Fingerprint</option>
              <option>Retinal Scan</option>
            </select>
          </Field>
          <FormActions>
            <PrimaryButton type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Station"}
            </PrimaryButton>
          </FormActions>
        </PanelCard>

        <PanelCard title="Stations">
          <PrimaryButton
            onClick={() => refetch()}
            disabled={isFetching}
            sx={{ mb: 1.5 }}
          >
            {isFetching ? "Loading..." : "Refresh"}
          </PrimaryButton>
          <DataTable rows={stationRows} />
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
