import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { adminApi as api } from "../utils/api.js";
import {
  normalizeList,
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

// Turn one picked date into a 7-day window
function getWeekRange(date) {
  if (!date) return { from: "", to: "" };

  const [year, month, day] = date.split("-").map(Number);
  const endDate = new Date(year, month - 1, day);
  endDate.setDate(endDate.getDate() + 6);

  const endYear = endDate.getFullYear();
  const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
  const endDay = String(endDate.getDate()).padStart(2, "0");

  return {
    from: date,
    to: `${endYear}-${endMonth}-${endDay}`,
  };
}

// Calculate total minutes from start and end time
function getTotalMinutes(startTime, endTime) {
  if (!startTime || !endTime) return null;

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const start = startHours * 60 + startMinutes;
  const end = endHours * 60 + endMinutes;

  if (end <= start) return null;

  return end - start;
}

function formatMinutes(totalMinutes) {
  if (totalMinutes === null) return "";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function formatHours(hours) {
  if (hours === "" || hours === null || hours === undefined) return "";

  const totalMinutes = Math.round(Number(hours) * 60);
  return formatMinutes(totalMinutes);
}

export default function RosterTab({ showToast }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    id: "",
    staff_id: "",
    staff_name: "",
    date: "",
    start_time: "",
    end_time: "",
  });

  const [filters, setFilters] = useState({
    staff_id: "",
    staff_name: "",
    weekDate: "",
  });

  const [staffResults, setStaffResults] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loadKey, setLoadKey] = useState(null);

  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const setFilter = (e) =>
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const weekRange = getWeekRange(filters.weekDate);
  const totalMinutes = getTotalMinutes(form.start_time, form.end_time);
  const totalLabel = formatMinutes(totalMinutes);

  // Load one staff member's roster for one 7-day window
  const { data: rosterRows = [], isFetching } = useQuery({
    queryKey: ["roster", loadKey],
    queryFn: () =>
      api
        .get(
          `/roster?staff_id=${encodeURIComponent(loadKey.staff_id)}&from=${encodeURIComponent(loadKey.from)}&to=${encodeURIComponent(loadKey.to)}`,
        )
        .then((r) => normalizeList(r.data)),
    enabled: loadKey !== null,
    onError: (err) => showToast(errMsg(err, "Failed to load roster"), true),
  });

  // Save new row or update existing row using the same endpoint
  const saveMutation = useMutation({
    mutationFn: (payload) => api.post("/roster/save", payload),
    onSuccess: (_, payload) => {
      showToast(payload.id ? "Roster updated." : "Roster saved.");

      // Keep selected staff, clear only the editable roster fields
      setForm((f) => ({
        ...f,
        id: "",
        date: "",
        start_time: "",
        end_time: "",
      }));

      qc.invalidateQueries({ queryKey: ["roster"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to save roster"), true),
  });

  // Put the chosen staff member into both filter state and form state
  const pickStaff = (staff) => {
    setSelectedStaff(staff);
    setStaffResults([]);

    setFilters((f) => ({
      ...f,
      staff_id: String(staff.staff_id),
      staff_name: staff.staff_name,
    }));

    setForm({
      id: "",
      staff_id: String(staff.staff_id),
      staff_name: staff.staff_name,
      date: "",
      start_time: "",
      end_time: "",
    });
  };

  // Find one staff member from direct staff ID
  const handleFindById = async () => {
    if (!filters.staff_id.trim()) {
      showToast("Enter a Staff ID first.", true);
      return;
    }

    try {
      const res = await api.get(
        `/staff/name-id?id=${encodeURIComponent(filters.staff_id)}`,
      );

      const staff = {
        staff_id: String(res.data.first ?? ""),
        staff_name: res.data.second ?? "",
      };

      if (!staff.staff_id || !staff.staff_name) {
        showToast("No staff found.", true);
        return;
      }

      pickStaff(staff);
      showToast("Staff selected.");
    } catch (err) {
      showToast(errMsg(err, "Failed to search staff"), true);
    }
  };

  // Search staff by name keyword
  const handleFindByName = async () => {
    if (!filters.staff_name.trim()) {
      showToast("Enter a staff name keyword first.", true);
      return;
    }

    try {
      const res = await api.get(
        `/staff/name-map?keyword=${encodeURIComponent(filters.staff_name)}`,
      );

      const rows = Object.entries(res.data || {}).map(([staff_id, staff_name]) => ({
        staff_id,
        staff_name,
      }));

      setStaffResults(rows);

      if (rows.length === 0) {
        showToast("No staff found.", true);
        return;
      }

      if (rows.length === 1) {
        pickStaff(rows[0]);
        showToast("Staff selected.");
      } else {
        showToast("Multiple staff found. Pick the correct one below.");
      }
    } catch (err) {
      showToast(errMsg(err, "Failed to search staff"), true);
    }
  };

  // Load roster for the selected staff member and selected week
  const handleLoad = () => {
    if (!selectedStaff) {
      showToast("Select a staff member first.", true);
      return;
    }

    if (!filters.weekDate) {
      showToast("Pick a date first.", true);
      return;
    }

    setLoadKey({
      staff_id: selectedStaff.staff_id,
      from: weekRange.from,
      to: weekRange.to,
    });
  };

  // Load one existing row back into the form for editing
  const handleEdit = (row) => {
    setSelectedStaff({
      staff_id: row.staff_id,
      staff_name: row.staff_name,
    });

    setFilters((f) => ({
      ...f,
      staff_id: String(row.staff_id),
      staff_name: row.staff_name,
      weekDate: row.date,
    }));

    setForm({
      id: row.id,
      staff_id: String(row.staff_id),
      staff_name: row.staff_name,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
    });
  };

  const handleClear = () => {
    setForm((f) => ({
      ...f,
      id: "",
      date: "",
      start_time: "",
      end_time: "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.staff_id) {
      showToast("Select a staff member first.", true);
      return;
    }

    if (!form.date || !form.start_time || !form.end_time) {
      showToast("Fill in date, start time, and end time.", true);
      return;
    }

    if (totalMinutes === null) {
      showToast("End time must be later than start time.", true);
      return;
    }

    const payload = {
      staff_id: Number(form.staff_id),
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      hours: Number((totalMinutes / 60).toFixed(2)),
    };

    if (form.id) {
      payload.id = Number(form.id);
    }

    saveMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="Rostering Information"
        description="Find one staff member, load one 7-day roster window, and create or update roster entries."
      />

      <TwoColumn>
        <PanelCard
          title={form.id ? "Update Roster Entry" : "Create Roster Entry"}
          component="form"
          onSubmit={handleSubmit}
        >
          {/* Staff lookup */}
          <Field label="Find Staff by ID">
            <input
              name="staff_id"
              type="text"
              value={filters.staff_id}
              onChange={setFilter}
              placeholder="Staff ID"
            />
          </Field>
          <FormActions>
            <PrimaryButton type="button" onClick={handleFindById}>
              Find Staff
            </PrimaryButton>
          </FormActions>

          <Field label="Search Staff by Name">
            <input
              name="staff_name"
              type="text"
              value={filters.staff_name}
              onChange={setFilter}
              placeholder="Staff name keyword"
            />
          </Field>
          <FormActions>
            <PrimaryButton type="button" onClick={handleFindByName}>
              Search Name
            </PrimaryButton>
          </FormActions>

          {staffResults.length > 1 ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Matching staff
              </Typography>
              <Box sx={{ display: "grid", gap: 1 }}>
                {staffResults.map((staff) => (
                  <GhostButton
                    key={staff.staff_id}
                    type="button"
                    onClick={() => pickStaff(staff)}
                    sx={{ justifyContent: "flex-start", textTransform: "none" }}
                  >
                    {staff.staff_name} ({staff.staff_id})
                  </GhostButton>
                ))}
              </Box>
            </Box>
          ) : null}

          {/* Roster form */}
          <Field label="Staff ID">
            <input name="staff_id" type="text" readOnly value={form.staff_id} />
          </Field>

          <Field label="Staff Name">
            <input
              name="staff_name"
              type="text"
              readOnly
              value={form.staff_name}
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
              name="start_time"
              type="time"
              required
              value={form.start_time}
              onChange={set}
            />
          </Field>

          <Field label="End Time">
            <input
              name="end_time"
              type="time"
              required
              value={form.end_time}
              onChange={set}
            />
          </Field>

          <Field label="Total Hours + Minutes">
            <input type="text" readOnly value={totalLabel} />
          </Field>

          <FormActions>
            <PrimaryButton type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : form.id
                  ? "Update Roster"
                  : "Save Roster"}
            </PrimaryButton>

            <GhostButton type="button" onClick={handleClear}>
              Clear
            </GhostButton>
          </FormActions>
        </PanelCard>

        <PanelCard title="Roster Overview">
          {/* Week filter */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {selectedStaff
              ? `Selected staff: ${selectedStaff.staff_name} (${selectedStaff.staff_id})`
              : "Select a staff member first."}
          </Typography>

          <InlineFields>
            <input
              name="weekDate"
              type="date"
              value={filters.weekDate}
              onChange={setFilter}
            />
            <input type="text" readOnly value={weekRange.from} placeholder="From" />
            <input type="text" readOnly value={weekRange.to} placeholder="To" />
            <PrimaryButton
              type="button"
              onClick={handleLoad}
              disabled={!selectedStaff || !filters.weekDate || isFetching}
            >
              {isFetching ? "Loading..." : "Load"}
            </PrimaryButton>
          </InlineFields>

          {/* Weekly roster list */}
          {rosterRows.length === 0 ? (
            <Box
              sx={{
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                color: "text.secondary",
              }}
            >
              No data
            </Box>
          ) : (
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.2fr 1fr 1fr 1fr auto",
                  gap: 1,
                  p: 1.25,
                  fontWeight: 700,
                  bgcolor: "rgba(0,0,0,0.03)",
                }}
              >
                <Box>Date</Box>
                <Box>Staff Name</Box>
                <Box>Start</Box>
                <Box>End</Box>
                <Box>Total</Box>
                <Box>Action</Box>
              </Box>

              {rosterRows.map((row) => (
                <Box
                  key={row.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.2fr 1fr 1fr 1fr auto",
                    gap: 1,
                    p: 1.25,
                    alignItems: "center",
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box>{row.date}</Box>
                  <Box>{row.staff_name}</Box>
                  <Box>{row.start_time}</Box>
                  <Box>{row.end_time}</Box>
                  <Box>{formatHours(row.hours)}</Box>
                  <Box>
                    <PrimaryButton
                      type="button"
                      size="small"
                      onClick={() => handleEdit(row)}
                    >
                      Edit
                    </PrimaryButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
