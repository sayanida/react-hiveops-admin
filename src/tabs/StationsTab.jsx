import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, FormHelperText } from "@mui/material";
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
  GhostButton,
  TwoColumn,
} from "./shared.jsx";

export default function StationsTab({ showToast }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", location: "", type: "" });
  const set = (e) => {
    const { name, value } = e.target;

    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "This field is required.";
    if (!form.location.trim()) nextErrors.location = "This field is required.";
    if (!form.type) nextErrors.type = "This field is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleEdit = (station) => {
    setForm({
      name: station.name ?? "",
      location: station.location ?? "",
      type: station.type ?? "",
    });
    setEditingStationId(station.id);
    setErrors({});
  };

  const handleClear = () => {
    setForm({ name: "", location: "", type: "" });
    setErrors({});
    setEditingStationId(null);
  };

  const {
    data: stationRows = [],
    isFetching,
  } = useQuery({
    queryKey: ["stations"],
    queryFn: () => api.get("/stations").then((r) => normalizeList(r.data)),  
  });

  const formatType = (type) => {
  switch (type) {
    case "CARD":
      return "Card";
    case "FACE":
      return "Face";
    case "FINGERPRINT":
      return "Fingerprint";
    case "RETINAL_SCAN":
      return "Retinal Scan";
    default:
      return type;
    }
  };

  const displayRows = stationRows.map(({ id, ...rest }) => ({
    ...rest,
    type: formatType(rest.type),
  }));

  const saveMutation = useMutation({
    mutationFn: (payload) => api.post("/stations", payload),
    onSuccess: () => {
      showToast("Station saved.");
      setForm({ name: "", location: "", type: "" });
      qc.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to save station"), true),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/stations/${id}`, payload),  
    onSuccess: () => {
      showToast("Station updated.");
      setForm({ name: "", location: "", type: "" });
      setEditingStationId(null);
      qc.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to update station"), true),
  });

  const [editingStationId, setEditingStationId] = useState(null);

  return (
    <div>
      <PageHeader
        title="Clock Stations"
        description="Set up and manage clock stations."
      />
      <TwoColumn>
        <PanelCard
          title="Add Clock Station"
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!validateForm()) return;

            if (editingStationId) {
              updateMutation.mutate({
                id: editingStationId,
                payload: form,
              });
              return;
            }

            saveMutation.mutate(form);
          }}
        >
          {Object.keys(errors).length > 0 ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              Please fill in all required fields before saving.
            </Alert>
          ) : null}
          <Field label="Station Name">
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={set}
            />
            {errors.name ? (
              <FormHelperText error>{errors.name}</FormHelperText>
            ) : null}
          </Field>
          <Field label="Location">
            <input
              name="location"
              type="text"
              value={form.location}
              onChange={set}
            />
            {errors.location ? (
              <FormHelperText error>{errors.location}</FormHelperText>
            ) : null}
          </Field>
          <Field label="Type">
            <select name="type" value={form.type} onChange={set}>
              <option value="">Select</option>
              <option value="CARD">Card</option>
              <option value="FACE">Face</option>
              <option value="FINGERPRINT">Fingerprint</option>
              <option value="RETINAL_SCAN">Retinal Scan</option>
            </select>
            {errors.type ? (
              <FormHelperText error>{errors.type}</FormHelperText>
            ) : null}
          </Field>
          <FormActions>
            <PrimaryButton 
            type="submit" 
            disabled={saveMutation.isPending || updateMutation.isPending}
            >
              {saveMutation.isPending || updateMutation.isPending
                ? editingStationId
                  ? "Updating..."
                  : "Saving..."
                : editingStationId
                  ? "Update"
                  : "Save"}
            </PrimaryButton>
            {editingStationId ? (
              <GhostButton type="button" onClick={handleClear}>
                Clear
              </GhostButton>
            ) : null}
          </FormActions>
        </PanelCard>

        <PanelCard title="Clock Stations">
          <DataTable
            rows={displayRows}
            actionsHeader=""
            renderRowActions={(_, i) => (
              <PrimaryButton
                type="button"
                size="small"
                onClick={() => handleEdit(stationRows[i])}
              >
                Edit
              </PrimaryButton>
            )}
          />
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
