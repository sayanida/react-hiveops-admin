import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi as api } from "../utils/api.js";
import {
  normalizeList,
  DataTable,
  Field,
  errMsg,
  FormActions,
  InlineFields,
  PageHeader,
  PanelCard,
  PrimaryButton,
  TwoColumn,
} from "./shared.jsx";

export default function RosterTab({ showToast }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    staffId: "",
    date: "",
    startTime: "",
    hours: "",
  });
  const [range, setRange] = useState({ from: "", to: "" });
  const [loadKey, setLoadKey] = useState(null);

  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const { data: rosterRows = [], isFetching } = useQuery({
    queryKey: ["roster", loadKey],
    queryFn: () =>
      api
        .get(
          `/roster?from=${encodeURIComponent(loadKey.from)}&to=${encodeURIComponent(loadKey.to)}`,
        )
        .then((r) => normalizeList(r.data)),
    enabled: loadKey !== null,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => api.post("/roster", payload),
    onSuccess: () => {
      showToast("Roster saved.");
      setForm({ staffId: "", date: "", startTime: "", hours: "" });
      qc.invalidateQueries({ queryKey: ["roster"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to save roster"), true),
  });

  return (
    <div>
      <PageHeader
        title="Rostering Information"
        description="Schedule staff for date, start time, and number of hours."
      />
      <TwoColumn>
        <PanelCard
          title="Create Roster Entry"
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
        >
          <Field label="Staff ID">
            <input
              name="staffId"
              type="text"
              required
              value={form.staffId}
              onChange={set}
            />
          </Field>
          <Field label="Date">
            <input
              name="date"
              type="date"
              required
              value={form.date}
              onChange={set}
            />
          </Field>
          <Field label="Start Time">
            <input
              name="startTime"
              type="time"
              required
              value={form.startTime}
              onChange={set}
            />
          </Field>
          <Field label="Hours">
            <input
              name="hours"
              type="number"
              min="0"
              step="0.25"
              required
              value={form.hours}
              onChange={set}
            />
          </Field>
          <FormActions>
            <PrimaryButton type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Roster"}
            </PrimaryButton>
          </FormActions>
        </PanelCard>

        <PanelCard title="Roster Overview">
          <InlineFields>
            <input
              type="date"
              value={range.from}
              onChange={(e) =>
                setRange((r) => ({ ...r, from: e.target.value }))
              }
            />
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            />
            <PrimaryButton
              onClick={() => setLoadKey({ ...range })}
              disabled={isFetching}
            >
              {isFetching ? "Loading..." : "Load"}
            </PrimaryButton>
          </InlineFields>
          <DataTable rows={rosterRows} />
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
