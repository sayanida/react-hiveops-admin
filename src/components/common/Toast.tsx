/*
Toast.tsx
	Generic toast notification component (small temporary message on screen)
	•	Uses MUI Snackbar + Alert
	•	Automatically closes after ~2.6 seconds
*/

import { Alert, Snackbar } from "@mui/material";

interface ToastState {
  msg: string;
  error: boolean;
  visible: boolean;
}

interface ToastProps {
  toast: ToastState;
}

export default function Toast({ toast }: ToastProps): JSX.Element {
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
