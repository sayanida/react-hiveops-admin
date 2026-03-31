/*
StaffDashboard.jsx
	Main dashboard component for staff
	•	Combines multiple card components: ReaderPanel, EventsCard, RosterCard, BreaksCard
	•	Uses staffApi for API calls
	•	Uses react-query’s useQuery / useMutation extensively
	•	Native input/select elements can be replaced with MUI TextField/Select, keeping value and onChange
	•	Need to pay attention to date and text field handling
	
  Internal Components:
	•	StaffCard: Generic card layout
	•	ReaderPanel: IoT reader operations (token input, registration, action sending)
	•	EventsCard, RosterCard, BreaksCard: Fetch and display data
*/

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { staffApi as api } from "../../utils/api.js";
import {
  DataTable,
  InlineFields,
  PrimaryButton,
  TwoColumn,
} from "../../tabs/shared.jsx";

function normalizeList(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp?.data && Array.isArray(resp.data)) return resp.data;
  if (resp?.items && Array.isArray(resp.items)) return resp.items;
  return [];
}

function errMsg(err, fallback = "Request failed") {
  return err?.response?.data || err?.message || fallback;
}

function StaffCard({ title, action, children }) {
  return (
    <Card
      variant="outlined"
      sx={{ boxShadow: "0 10px 24px rgba(28, 26, 23, 0.08)" }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Typography variant="h6">{title}</Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function ReaderPanel({ showToast }) {
  const qc = useQueryClient();

  const [workerToken, setWorkerToken] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [breakReason, setBreakReason] = useState("");
  const [breakNote, setBreakNote] = useState("");

  const DEVICE_ID = "DEVICE-001";
  const STATION_NAME = "North Shed";

  function buildPayload(action) {
    const payload = {
      deviceId: DEVICE_ID,
      stationName: STATION_NAME,
      workerToken,
      action,
    };
    if (action === "break-start") {
      payload.reason = breakReason;
      payload.note = breakNote;
    }
    return payload;
  }

  const eventMutation = useMutation({
    mutationFn: (payload) => api.post("/clock-events", payload),
    onSuccess: () => {
      showToast("Event captured.");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err) => showToast(errMsg(err, "Failed to capture"), true),
  });

  const pingMutation = useMutation({
    mutationFn: () =>
      api.post("/devices/ping", {
        deviceId: DEVICE_ID,
        stationName: STATION_NAME,
      }),
    onSuccess: () => showToast("Device pinged."),
    onError: (err) => showToast(errMsg(err, "Failed to ping"), true),
  });

  return (
    <Card
      variant="outlined"
      sx={{
        boxShadow: "0 10px 24px rgba(28, 26, 23, 0.08)",
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          IoT Reader
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tap card or scan badge, then choose the action below.
        </Typography>

        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {DEVICE_ID} - {STATION_NAME}
          </Typography>
          <Typography variant="body2">Worker Identifier</Typography>
          <input
            type="text"
            placeholder="Card ID"
            value={workerToken}
            onChange={(e) => setWorkerToken(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #d9d9d9",
            }}
          />
          <Typography variant="body2">Worker Name</Typography>
          <input
            type="text"
            placeholder="Bruce Wayne"
            value={workerName}
            onChange={(e) => setWorkerName(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #d9d9d9",
            }}
          />
          <PrimaryButton
            onClick={() => pingMutation.mutate()}
            disabled={pingMutation.isPending}
            sx={{ alignSelf: "flex-start", mt: 0.5 }}
          >
            {pingMutation.isPending ? "Pinging..." : "Register Bio Info"}
          </PrimaryButton>
        </Box>

        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 1,
          }}
        >
          {["clock-in", "clock-out", "break-start", "break-end"].map(
            (action) => (
              <PrimaryButton
                key={action}
                disabled={eventMutation.isPending || !workerToken.trim()}
                onClick={() => eventMutation.mutate(buildPayload(action))}
                sx={{
                  color: "#2c1e0e",
                  backgroundColor:
                    action === "clock-out"
                      ? "#f3c77e"
                      : action === "break-start"
                        ? "#cfe0c3"
                        : action === "break-end"
                          ? "#e8d0b7"
                          : "#e4a13b",
                  "&:hover": { filter: "brightness(0.98)" },
                }}
              >
                {action
                  .split("-")
                  .map((w) => w[0].toUpperCase() + w.slice(1))
                  .join(" ")}
              </PrimaryButton>
            ),
          )}
        </Box>

        <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
          <Typography variant="body2">Break Reason</Typography>
          <select
            value={breakReason}
            onChange={(e) => setBreakReason(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #d9d9d9",
            }}
          >
            <option value="">Select reason</option>
            <option>Meal</option>
            <option>Hydration</option>
            <option>Equipment issue</option>
            <option>Weather delay</option>
            <option>Other</option>
          </select>
          <input
            type="text"
            placeholder="Optional note"
            value={breakNote}
            onChange={(e) => setBreakNote(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #d9d9d9",
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function EventsCard({ showToast }) {
  const {
    data: eventRows = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      api.get("/clock-events?limit=8").then((r) => normalizeList(r.data)),
    onError: (err) => showToast(errMsg(err, "Failed to load events"), true),
  });

  return (
    <StaffCard
      title="Latest Events"
      action={
        <PrimaryButton onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Loading..." : "Refresh"}
        </PrimaryButton>
      }
    >
      <DataTable rows={eventRows} />
    </StaffCard>
  );
}

function RosterCard({ showToast }) {
  const [date, setDate] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [loadKey, setLoadKey] = useState(null);

  const { data: rosterRows = [], isFetching } = useQuery({
    queryKey: ["roster", loadKey],
    queryFn: () => {
      const qs = `?date=${encodeURIComponent(loadKey.date)}&workerId=${encodeURIComponent(loadKey.workerId)}`;
      return api.get(`/roster${qs}`).then((r) => normalizeList(r.data));
    },
    enabled: loadKey !== null,
    onError: (err) => showToast(errMsg(err, "Failed to load roster"), true),
  });

  return (
    <StaffCard
      title="Roster Access"
      action={
        <PrimaryButton
          onClick={() => setLoadKey({ date, workerId })}
          disabled={isFetching}
        >
          {isFetching ? "Loading..." : "Load"}
        </PrimaryButton>
      }
    >
      <InlineFields>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Worker ID"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
        />
      </InlineFields>
      <DataTable rows={rosterRows} />
    </StaffCard>
  );
}

function BreaksCard({ showToast }) {
  const {
    data: breakRows = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["breaks"],
    queryFn: () =>
      api.get("/breaks?limit=8").then((r) => normalizeList(r.data)),
    onError: (err) => showToast(errMsg(err, "Failed to load breaks"), true),
  });

  return (
    <StaffCard
      title="Break Log"
      action={
        <PrimaryButton onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Loading..." : "Refresh"}
        </PrimaryButton>
      }
    >
      <DataTable rows={breakRows} />
    </StaffCard>
  );
}

export default function StaffDashboard({ showToast }) {
  return (
    <Box sx={{ position: "relative", zIndex: 1, px: { xs: 2, md: 5 }, py: 4 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "360px 1fr" },
          gap: 3,
        }}
      >
        <ReaderPanel showToast={showToast} />

        <Box sx={{ display: "grid", gap: 2.5 }}>
          <EventsCard showToast={showToast} />
          <TwoColumn>
            <RosterCard showToast={showToast} />
            <BreaksCard showToast={showToast} />
          </TwoColumn>
        </Box>
      </Box>
    </Box>
  );
}
