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
export function DataTable({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No data
        </Typography>
      </Paper>
    );
  }

  const headers = Object.keys(rows[0]);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700 }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} hover>
              {headers.map((h) => (
                <TableCell key={h}>{row[h] ?? ""}</TableCell>
              ))}
            </TableRow>
          ))}
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
          },
          "& textarea": {
            minHeight: 88,
            resize: "vertical",
          },
          "& input:focus, & select:focus, & textarea:focus": {
            outline: "2px solid",
            outlineColor: "primary.light",
            outlineOffset: 0,
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
      <Typography variant="h5" sx={{ mb: 0.75 }}>
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
        boxShadow: "0 10px 24px rgba(28, 26, 23, 0.08)",
      }}
    >
      <CardContent>
        {title ? (
          <Typography variant="h6" sx={{ mb: 1.25 }}>
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

export function PrimaryButton({ children, ...props }) {
  return (
    <Button variant="contained" color="secondary" {...props}>
      {children}
    </Button>
  );
}

export function GhostButton({ children, ...props }) {
  return (
    <Button variant="outlined" color="inherit" {...props}>
      {children}
    </Button>
  );
}

// ─── Extract error message from Axios error ───────────────────────────────────
export function errMsg(err, fallback = "Request failed") {
  return err?.response?.data || err?.message || fallback;
}
