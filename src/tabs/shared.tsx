/*
shared.jsx
	A shared file containing small reusable UI components and utility functions used across multiple pages or tabs.
	
  Functionality / Exports:
	•	normalizeList → Normalizes API responses into arrays
	•	DataTable → Generic table component
	•	Field / InlineFields → Form input wrappers with label styling for native input/select/textarea
	•	PageHeader → Displays page title and description
	•	TwoColumn → Two-column responsive layout wrapper
	•	PanelCard → Standard card component with title + content, supports onSubmit
	•	FormActions → Wrapper for form action buttons row
	•	PrimaryButton / GhostButton → Themed buttons (filled / outlined)
	•	errMsg → Helper to extract messages from Axios errors
	
  Notes / MUI migration:
	•	Field and InlineFields apply CSS directly to native input elements
	•	When replacing with MUI TextField / Select, adjust or remove these styles
	
  Recommended approach:
  keep Field as FormControl + FormLabel and replace child inputs with MUI components
*/

import {
  Button,
  Box,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

// ─── Normalise any API list response ─────────────────────────────────────────
export function normalizeList(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp.data)) return resp.data;
  if (resp && Array.isArray(resp.items)) return resp.items;
  return [];
}

// ─── Generic data table ───────────────────────────────────────────────────────
export function DataTable({
  rows,
  renderRowActions,
  actionsHeader = "Actions",
}) {
  if (!rows || rows.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No data
        </Typography>
      </Paper>
    );
  }

  const headers = Object.keys(rows[0]);

  const hasActions = typeof renderRowActions === "function";

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderRadius: 1.5,
        overflow: "hidden",
        backgroundColor: "rgba(251, 253, 255, 0.92)",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700 }}>
                {h}
              </TableCell>
            ))}
            {hasActions ? (
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {actionsHeader}
              </TableCell>
            ) : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => {
            const rowKey = String(row.id ?? row.ID ?? row._id ?? i);
            return (
              <TableRow key={rowKey} hover>
                {headers.map((h) => (
                  <TableCell key={h} sx={{ color: "text.primary" }}>
                    {row[h] ?? ""}
                  </TableCell>
                ))}
                {hasActions ? (
                  <TableCell align="right">{renderRowActions(row)}</TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Reusable form field ──────────────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <FormControl fullWidth margin="normal" variant="standard">
      <FormLabel sx={{ mb: 0.75, color: "text.secondary", fontSize: 14 }}>
        {label}
      </FormLabel>
      <Box
        sx={{
          "& input, & select, & textarea": {
            width: "100%",
            font: "inherit",
            padding: "10px 12px",
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            borderRadius: 10,
            transition: "border-color 120ms ease, box-shadow 120ms ease",
          },
          "& textarea": {
            minHeight: 88,
            resize: "vertical",
          },
          "& input:focus, & select:focus, & textarea:focus": {
            outline: "none",
            borderColor: "primary.main",
            boxShadow: "0 0 0 4px rgba(15, 76, 129, 0.12)",
          },
        }}
      >
        {children}
      </Box>
    </FormControl>
  );
}

export function PageHeader({ title, description }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="h5" sx={{ mb: 0.75, color: "text.primary" }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}

export function TwoColumn({ children }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        gap: 2.5,
      }}
    >
      {children}
    </Box>
  );
}

export function PanelCard({ title, children, component = "div", onSubmit }) {
  return (
    <Card
      variant="outlined"
      component={component}
      onSubmit={onSubmit}
      sx={{
        borderRadius: 2,
        boxShadow: "0 20px 44px rgba(10, 38, 67, 0.08)",
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 251, 254, 0.96) 100%)",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
        {title ? (
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            {title}
          </Typography>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}

export function InlineFields({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.25,
        flexWrap: "wrap",
        mb: 1.5,
        "& input, & select": {
          font: "inherit",
          padding: "10px 12px",
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
          borderRadius: 10,
        },
      }}
    >
      {children}
    </Box>
  );
}

export function FormActions({ children }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ mt: 1.5 }}>
      {children}
    </Stack>
  );
}

export function PrimaryButton({ children, sx, ...props }) {
  return (
    <Button
      variant="contained"
      color="primary"
      sx={[
        {
          "&.Mui-disabled": {
            backgroundColor: "rgba(134, 138, 143, 0.5)",
            color: "rgba(238, 240, 243, 0.82)",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Button>
  );
}

export function GhostButton({ children, ...props }) {
  return (
    <Button
      sx={{ textTransform: "none" }}
      variant="outlined"
      color="inherit"
      {...props}
    >
      {children}
    </Button>
  );
}

// ─── Extract error message from Axios error ───────────────────────────────────
export function errMsg(err, fallback = "Request failed") {
  return err?.response?.data || err?.message || fallback;
}
