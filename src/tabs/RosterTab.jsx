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

function EmptyStateMessage({ title, subtitle }) {
  return (
    <Box
      sx={{
        minHeight: 140,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        backgroundColor: "rgba(255,255,255,0.35)",
        px: 2,
      }}
    >
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
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

  // Left panel: one search box for selecting a staff member to create/update roster
  const [entrySearch, setEntrySearch] = useState("");

  // Right panel: independent filters for viewing roster list
  const [listFilters, setListFilters] = useState({
    query: "",      // optional name or ID filter; empty means "All"
    weekDate: "",
  });

  const [staffResults, setStaffResults] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Right panel load key: used only for loading the roster list by date range
  const [listLoadKey, setListLoadKey] = useState(null);

  // Left form fields for create/update
  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Right panel filter handler
  const setListFilter = (e) =>
    setListFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const weekRange = getWeekRange(listFilters.weekDate);
  const totalMinutes = getTotalMinutes(form.startTime, form.endTime);
  const totalLabel = formatMinutes(totalMinutes);

  // Right panel state helpers
  const hasLoadedRosterList = listLoadKey !== null;

  // Right panel: load roster list by date range, optionally filtered by name or ID
  const { data: rosterRows = [], isFetching, isError } = useQuery({
    queryKey: ["roster-list", listLoadKey],
    queryFn: () => {
      let url =
        `/roster/list?from=${encodeURIComponent(listLoadKey.from)}` +
        `&to=${encodeURIComponent(listLoadKey.to)}`;

      // Optional query filter: if empty, backend should return all rostered staff
      if (listLoadKey.query) {
        url += `&query=${encodeURIComponent(listLoadKey.query)}`;
      }

      return api.get(url).then((r) => normalizeList(r.data));
    },
    enabled: listLoadKey !== null,
  });

  // mock test
  /*const { data: rosterRows = [], isFetching } = useQuery({
    queryKey: ["roster-list", listLoadKey],
    queryFn: async () => {
      let url =
        `http://localhost:3001/roster/list?from=${encodeURIComponent(listLoadKey.from)}` +
        `&to=${encodeURIComponent(listLoadKey.to)}`;

      // Optional query filter: if empty, mock server returns all rostered staff
      if (listLoadKey.query) {
        url += `&query=${encodeURIComponent(listLoadKey.query)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Mock roster list request failed: ${response.status}`);
      }

      const data = await response.json();
      return normalizeList(data);
    },
    enabled: listLoadKey !== null,
  });*/


  const saveMutation = useMutation({
    mutationFn: ({ recordId, body }) => {
      if (recordId) {
        return api.put(`/roster/${encodeURIComponent(recordId)}`, body);
      }

      return api.post("/roster", body);
    },
    onSuccess: (_, variables) => {
      showToast(variables.recordId ? "Roster updated." : "Roster saved.");

      setForm((f) => ({
        ...f,
        id: "",
        date: "",
        startTime: "",
        endTime: "",
        status: "SCHEDULED",
      }));

      // Refresh the right panel list if it is currently being viewed
      qc.invalidateQueries({ queryKey: ["roster-list"] });
    },
    onError: (err) =>
      showToast(getApiErrorMessage(err, "Failed to save roster"), true),
  });

  // Put the chosen staff member into the left create/update form only
  const pickStaff = (staff) => {
    setSelectedStaff(staff);
    setStaffResults([]);

    // Optional: show the selected staff back in the search box
    setEntrySearch(`${staff.staffName} (${staff.staffId})`);

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

  // Helper: if the input is only digits, treat it as a staff ID search
  function isNumericSearch(value) {
    return /^\d+$/.test(value.trim());
  }

  // Left panel staff lookup: one box that supports ID or name
  const handleFindStaff = async () => {
    const searchValue = entrySearch.trim();

    if (!searchValue) {
      showToast("Enter a staff name or ID first.", true);
      return;
    }

    try {
      if (isNumericSearch(searchValue)) {
        // Search by exact staff ID
        const res = await api.get(
          `/staff/${encodeURIComponent(searchValue)}/name`
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
        return;
      }

      // Search by name keyword
      const res = await api.get(
        `/staff/search?name=${encodeURIComponent(searchValue)}`
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

  // Right panel load: date range is required, staff filter is optional
  const handleLoad = () => {
    if (!listFilters.weekDate) {
      showToast("Pick a date first.", true);
      return;
    }

    setListLoadKey({
      from: weekRange.from,
      to: weekRange.to,
      query: listFilters.query.trim(), // empty = All staff
    });
  };

  // Clicking Edit on the right list fills the left create/update form
  const handleEdit = (row) => {
    setSelectedStaff({
      staffId: row.staffId,
      staffName: row.staffName,
    });

    setEntrySearch(`${row.staffName} (${row.staffId})`);

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
          {/* Left panel staff lookup for create/update only */}
          <Field label="Search Staff by Name or ID">
            <input
              type="text"
              value={entrySearch}
              onChange={(e) => setEntrySearch(e.target.value)}
              placeholder="Search by name or ID"
            />
          </Field>

          <FormActions>
            <PrimaryButton type="button" onClick={handleFindStaff}>
              Find Staff
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

        <PanelCard title="Rostering List">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Select a date to view all staff rostered in this 7-day window.
            You can optionally filter by staff name or ID, or leave it blank to show all.
          </Typography>

          {/* Optional filter for the roster list only */}
          <Field label="Optional Staff Filter">
            <input
              name="query"
              type="text"
              value={listFilters.query}
              onChange={setListFilter}
              placeholder="Leave blank for All, or enter name / ID"
            />
          </Field>

          <InlineFields>
            <input
              name="weekDate"
              type="date"
              value={listFilters.weekDate}
              onChange={setListFilter}
            />
            <input type="text" readOnly value={weekRange.from} placeholder="From" />
            <input type="text" readOnly value={weekRange.to} placeholder="To" />
            <PrimaryButton
              type="button"
              onClick={handleLoad}
              disabled={!listFilters.weekDate || isFetching}
            >
              {isFetching ? "Loading..." : "Load"}
            </PrimaryButton>
          </InlineFields>

          {!hasLoadedRosterList ? null : isError ? (
            <EmptyStateMessage
              title="Unable to load rostering list."
              subtitle="Please try again or check the API response."
            />
          ) : rosterRows.length === 0 ? (
            <EmptyStateMessage
              title="No staff rostered for this period."
              subtitle="Try selecting a different date range."
            />
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