import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, List, ListItem, ListItemText } from "@mui/material";
import { adminApi as api } from "../utils/api.js";
import {
  normalizeList,
  DataTable,
  errMsg,
  InlineFields,
  PageHeader,
  PanelCard,
  PrimaryButton,
  TwoColumn,
} from "./shared.jsx";

export default function ExceptionsTab({ showToast }) {
  const [date, setDate] = useState("");
  const [loadKey, setLoadKey] = useState(null);

  const { data: exceptionRows = [], isFetching } = useQuery({
    queryKey: ["exceptions", loadKey],
    queryFn: () =>
      api
        .get(`/exceptions?date=${encodeURIComponent(loadKey)}`)
        .then((r) => normalizeList(r.data)),
    enabled: loadKey !== null,
    onError: (err) => showToast(errMsg(err, "Failed to load exceptions"), true),
  });

  return (
    <div>
      <PageHeader
        title="Exception Reports"
        description="Daily compliance checks and anomalies."
      />
      <TwoColumn>
        <PanelCard title="Daily Exceptions">
          <InlineFields>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <PrimaryButton
              onClick={() => setLoadKey(date)}
              disabled={isFetching}
            >
              {isFetching ? "Loading..." : "Load"}
            </PrimaryButton>
          </InlineFields>
          <DataTable rows={exceptionRows} />
        </PanelCard>

        <PanelCard title="Exception Types">
          <Box sx={{ color: "text.secondary" }}>
            <List dense>
              <ListItem disablePadding>
                <ListItemText primary="Clocked in but not clocked out" />
              </ListItem>
              <ListItem disablePadding>
                <ListItemText primary="More than 4 hours without break" />
              </ListItem>
              <ListItem disablePadding>
                <ListItemText primary="Attempt when not rostered" />
              </ListItem>
            </List>
          </Box>
        </PanelCard>
      </TwoColumn>
    </div>
  );
}
