/*
ApiConfigBar.jsx
  A small UI component for entering and saving the API base URL.
	•	Input URL via a TextField
	•	Save to localStorage with a button or Enter key
	•	Shows an error if input is empty
*/

import { Button, Stack, TextField } from "@mui/material";

export default function ApiConfigBar({
  storageKey,
  apiBase,
  setApiBase,
  showToast,
  inputId = "apiBase",
}) {
  const saveApi = () => {
    const v = apiBase.trim();
    if (!v) {
      showToast("API base URL required.", true);
      return;
    }
    localStorage.setItem(storageKey, v);
    showToast("API base URL saved.");
  };

  return (
    <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
      <TextField
        id={inputId}
        label="API Base URL"
        size="small"
        placeholder="https://api.yourapp.com"
        value={apiBase}
        onChange={(e) => setApiBase(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && saveApi()}
        sx={{ minWidth: 260 }}
      />
      <Button variant="contained" color="primary" onClick={saveApi}>
        Save
      </Button>
    </Stack>
  );
}
