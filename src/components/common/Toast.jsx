import { Alert, Snackbar } from "@mui/material";

export default function Toast({ toast }) {
  return (
    <Snackbar
      open={toast.visible}
      autoHideDuration={2600}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        elevation={6}
        variant="filled"
        severity={toast.error ? "error" : "success"}
        sx={{ width: "100%" }}
      >
        {toast.msg}
      </Alert>
    </Snackbar>
  );
}
