import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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

export default function ReportsTab({ showToast }) {
  const [form, setForm] = useState({ from: "", to: "", type: "" });
  const [reportRows, setRows] = useState([]);

  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const reportMutation = useMutation({
    mutationFn: (payload) => {
      const path = payload.type === "pay" ? "/reports/pay" : "/reports/time";
      return api.post(path, { from: payload.from, to: payload.to });
    },
    onSuccess: (res) => setRows(normalizeList(res.data)),
    onError: (err) => showToast(errMsg(err, "Failed to run report"), true),
  });

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Time and pay summaries for a selected period."
      />
      <TwoColumn>
        <PanelCard
          title="Generate Report"
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            reportMutation.mutate(form);
          }}
        >
          <Field label="From">
            <input
              name="from"
              type="date"
              required
              value={form.from}
              onChange={set}
            />
          </Field>
          <Field label="To">
            <input
              name="to"
              type="date"
              required
              value={form.to}
              onChange={set}
            />
          </Field>
          <Field label="Report Type">
            <select name="type" required value={form.type} onChange={set}>
              <option value="">Select</option>
              <option value="time">Time Information</option>
              <option value="pay">Pay Information</option>
            </select>
          </Field>
          <FormActions>
            <PrimaryButton type="submit" disabled={reportMutation.isPending}>
              {reportMutation.isPending ? "Running..." : "Run"}
            </PrimaryButton>
          </FormActions>
        </PanelCard>

        <PanelCard title="Report Results">
          <DataTable rows={reportRows} />
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
