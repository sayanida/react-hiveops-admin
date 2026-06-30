import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
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

function buildCsvFromRows(rows) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);
  const escapeValue = (value) => {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes("\n") || text.includes('"')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const headerLine = headers.map(escapeValue).join(",");
  const bodyLines = rows.map((row) =>
    headers.map((header) => escapeValue(row[header])).join(","),
  );

  return [headerLine, ...bodyLines].join("\n");
}

function triggerCsvDownload(csvText, filename) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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

  const reportTypeLabel =
    form.type === "pay" ? "Pay Information" : "Time Information";
  const csvFilename = useMemo(() => {
    const safeType = form.type || "report";
    const safeFrom = form.from || "from";
    const safeTo = form.to || "to";
    return `${safeType}_${safeFrom}_${safeTo}.csv`;
  }, [form.from, form.to, form.type]);

  const uniqueColumnCount = reportRows.length
    ? Object.keys(reportRows[0]).length
    : 0;

  const handleRunReport = (e) => {
    e.preventDefault();

    if (!form.from || !form.to || !form.type) {
      showToast("Select From, To, and Report Type.", true);
      return;
    }

    if (form.from > form.to) {
      showToast("From date must be earlier than or equal to To date.", true);
      return;
    }

    reportMutation.mutate(form);
  };

  const handleDownloadCsv = () => {
    if (!reportRows.length) {
      showToast("Run a report first.", true);
      return;
    }

    const csvText = buildCsvFromRows(reportRows);
    triggerCsvDownload(csvText, csvFilename);
    showToast("CSV downloaded.");
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Time and pay summaries for a selected period, including CSV export."
      />
      <TwoColumn>
        <PanelCard
          title="Generate Report"
          component="form"
          onSubmit={handleRunReport}
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
          <Stack spacing={1.25} sx={{ mb: 1.5 }}>
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {reportTypeLabel} | {form.from || "-"} to {form.to || "-"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rows: {reportRows.length} | Columns: {uniqueColumnCount}
              </Typography>
            </Alert>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleDownloadCsv}
                disabled={!reportRows.length}
                sx={{ textTransform: "none" }}
              >
                Download CSV
              </Button>
            </Box>
          </Stack>

          <DataTable rows={reportRows} />
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
