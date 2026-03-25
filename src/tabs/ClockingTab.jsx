import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminApi as api } from "../utils/api.js";
import {
  Field,
  errMsg,
  FormActions,
  PageHeader,
  PanelCard,
  PrimaryButton,
  TwoColumn,
} from "./shared.jsx";

export default function ClockingTab({ showToast }) {
  const [clockForm, setClockForm] = useState({
    staffId: "",
    eventType: "",
    timestamp: "",
    reason: "",
  });
  const [amendForm, setAmendForm] = useState({
    eventId: "",
    newTimestamp: "",
    auditReason: "",
  });

  const setC = (e) =>
    setClockForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const setA = (e) =>
    setAmendForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const clockMutation = useMutation({
    mutationFn: (payload) => api.post("/clock-events/admin", payload),
    onSuccess: () => {
      showToast("Clock event submitted.");
      setClockForm({ staffId: "", eventType: "", timestamp: "", reason: "" });
    },
    onError: (err) => showToast(errMsg(err, "Failed to submit"), true),
  });

  const amendMutation = useMutation({
    mutationFn: ({ eventId, ...payload }) =>
      api.patch(`/clock-events/${encodeURIComponent(eventId)}`, payload),
    onSuccess: () => {
      showToast("Clock event amended.");
      setAmendForm({ eventId: "", newTimestamp: "", auditReason: "" });
    },
    onError: (err) => showToast(errMsg(err, "Failed to amend"), true),
  });

  return (
    <div>
      <PageHeader
        title="Clocking In/Out"
        description="Admin actions when biometrics fail or urgent clock changes are needed."
      />
      <TwoColumn>
        <PanelCard
          title="Admin Clock Event"
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            clockMutation.mutate(clockForm);
          }}
        >
          <Field label="Staff ID">
            <input
              name="staffId"
              type="text"
              required
              value={clockForm.staffId}
              onChange={setC}
            />
          </Field>
          <Field label="Event">
            <select
              name="eventType"
              required
              value={clockForm.eventType}
              onChange={setC}
            >
              <option value="">Select</option>
              <option>Clock In</option>
              <option>Clock Out</option>
              <option>Break Start</option>
              <option>Break End</option>
            </select>
          </Field>
          <Field label="Date & Time">
            <input
              name="timestamp"
              type="datetime-local"
              required
              value={clockForm.timestamp}
              onChange={setC}
            />
          </Field>
          <Field label="Reason">
            <textarea
              name="reason"
              rows="3"
              required
              value={clockForm.reason}
              onChange={setC}
            />
          </Field>
          <FormActions>
            <PrimaryButton type="submit" disabled={clockMutation.isPending}>
              {clockMutation.isPending ? "Submitting..." : "Submit"}
            </PrimaryButton>
          </FormActions>
        </PanelCard>

        <PanelCard
          title="Amend Time Clock"
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            amendMutation.mutate(amendForm);
          }}
        >
          <Field label="Clock Event ID">
            <input
              name="eventId"
              type="text"
              required
              value={amendForm.eventId}
              onChange={setA}
            />
          </Field>
          <Field label="New Timestamp">
            <input
              name="newTimestamp"
              type="datetime-local"
              required
              value={amendForm.newTimestamp}
              onChange={setA}
            />
          </Field>
          <Field label="Reason (Audit)">
            <textarea
              name="auditReason"
              rows="3"
              required
              value={amendForm.auditReason}
              onChange={setA}
            />
          </Field>
          <FormActions>
            <PrimaryButton type="submit" disabled={amendMutation.isPending}>
              {amendMutation.isPending ? "Amending..." : "Amend"}
            </PrimaryButton>
          </FormActions>
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
