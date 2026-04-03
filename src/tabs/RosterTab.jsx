import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { adminApi as api } from "../utils/api.js";
import {
  normalizeList,
  Field,
  FormActions,
  GhostButton,
  InlineFields,
  PageHeader,
  PanelCard,
  PrimaryButton,
  TwoColumn,
} from "./shared.jsx";

// selected date + next 6 days
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

function getApiErrorMessage(err, fallback = "Request failed") {
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  }

  if (typeof err?.message === "string" && err.message.trim()) {
    return err.message;
  }

  return fallback;
}

export default function RosterTab({ showToast }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    id: "",
    staffId: "",
    staffName: "",
    date: "",
    startTime: "",
    endTime: "",
    status: "SCHEDULED",
  });

  const [filters, setFilters] = useState({
    staffId: "",
    staffName: "",
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
  const totalMinutes = getTotalMinutes(form.startTime, form.endTime);
  const totalLabel = formatMinutes(totalMinutes);

  const { data: rosterRows = [], isFetching } = useQuery({
    queryKey: ["roster", loadKey],
    queryFn: () =>
      api
        .get(
          `/roster?staffId=${encodeURIComponent(loadKey.staffId)}&from=${encodeURIComponent(loadKey.from)}&to=${encodeURIComponent(loadKey.to)}`,
        )
        .then((r) => normalizeList(r.data)),
    enabled: loadKey !== null,
  });

  const saveMutation = useMutation({
    mutationFn: ({ recordId, body }) => {
      if (recordId) {
        return api.put(`/roster/${encodeURIComponent(recordId)}`, body);
      }

      return api.post("/roster", body);
    },
    onSuccess: (_, variables) => {
      showToast(variables.recordId ? "Roster updated." : "Roster saved.");

      const savedWeekRange = getWeekRange(variables.selectedDate);

      setFilters((f) => ({
        ...f,
        weekDate: variables.selectedDate,
      }));

      setLoadKey({
        staffId: String(variables.selectedStaffId),
        from: savedWeekRange.from,
        to: savedWeekRange.to,
      });

      setForm((f) => ({
        ...f,
        id: "",
        date: "",
        startTime: "",
        endTime: "",
        status: "SCHEDULED",
      }));

      qc.invalidateQueries({ queryKey: ["roster"] });
    },
    onError: (err) =>
      showToast(getApiErrorMessage(err, "Failed to save roster"), true),
  });

  const pickStaff = (staff) => {
    setSelectedStaff(staff);
    setStaffResults([]);

    setFilters((f) => ({
      ...f,
      staffId: String(staff.staffId),
      staffName: staff.staffName,
    }));

    setForm({
      id: "",
      staffId: String(staff.staffId),
      staffName: staff.staffName,
      date: "",
      startTime: "",
      endTime: "",
      status: "SCHEDULED",
    });
  };

  const handleFindById = async () => {
    if (!filters.staffId.trim()) {
      showToast("Enter a Staff ID first.", true);
      return;
    }

    try {
      const res = await api.get(
        `/staff/${encodeURIComponent(filters.staffId)}/name`,
      );

      const staff = {
        staffId: String(res.data.id ?? ""),
        staffName: res.data.name ?? "",
      };

      if (!staff.staffId || !staff.staffName) {
        showToast("No staff found.", true);
        return;
      }

      pickStaff(staff);
      showToast("Staff selected.");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to search staff"), true);
    }
  };

  const handleFindByName = async () => {
    if (!filters.staffName.trim()) {
      showToast("Enter a staff name keyword first.", true);
      return;
    }

    try {
      const res = await api.get(
        `/staff/search?name=${encodeURIComponent(filters.staffName)}`,
      );

      const rows = Object.entries(res.data || {}).map(([staffId, staffName]) => ({
        staffId,
        staffName,
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
      showToast(getApiErrorMessage(err, "Failed to search staff"), true);
    }
  };

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
      staffId: selectedStaff.staffId,
      from: weekRange.from,
      to: weekRange.to,
    });
  };

  const handleEdit = (row) => {
    setSelectedStaff({
      staffId: row.staffId,
      staffName: row.staffName,
    });

    setFilters((f) => ({
      ...f,
      staffId: String(row.staffId),
      staffName: row.staffName,
      weekDate: row.date,
    }));

    setForm({
      id: row.id,
      staffId: String(row.staffId),
      staffName: row.staffName,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status ?? "SCHEDULED",
    });
  };

  const handleClear = () => {
    setForm((f) => ({
      ...f,
      id: "",
      date: "",
      startTime: "",
      endTime: "",
      status: "SCHEDULED",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.staffId) {
      showToast("Select a staff member first.", true);
      return;
    }

    if (!form.date || !form.startTime || !form.endTime) {
      showToast("Fill in date, start time, and end time.", true);
      return;
    }

    if (totalMinutes === null) {
      showToast("End time must be later than start time.", true);
      return;
    }

    const body = {
      staff: {
        id: Number(form.staffId),
      },
      rosterDate: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      status: form.status || "SCHEDULED",
    };

    saveMutation.mutate({
      recordId: form.id ? Number(form.id) : null,
      selectedDate: form.date,
      selectedStaffId: Number(form.staffId),
      body,
    });
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
          <Field label="Find Staff by ID">
            <input
              name="staffId"
              type="text"
              value={filters.staffId}
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
              name="staffName"
              type="text"
              value={filters.staffName}
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
                    key={staff.staffId}
                    type="button"
                    onClick={() => pickStaff(staff)}
                    sx={{ justifyContent: "flex-start", textTransform: "none" }}
                  >
                    {staff.staffName} ({staff.staffId})
                  </GhostButton>
                ))}
              </Box>
            </Box>
          ) : null}

          <Field label="Staff ID">
            <input name="staffId" type="text" readOnly value={form.staffId} />
          </Field>

          <Field label="Staff Name">
            <input
              name="staffName"
              type="text"
              readOnly
              value={form.staffName}
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

          <Field label="End Time">
            <input
              name="endTime"
              type="time"
              required
              value={form.endTime}
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {selectedStaff
              ? `Selected staff: ${selectedStaff.staffName} (${selectedStaff.staffId})`
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
                  <Box>{row.staffName}</Box>
                  <Box>{row.startTime}</Box>
                  <Box>{row.endTime}</Box>
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