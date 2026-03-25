/*
Theme.js
	Defines the MUI custom theme for the app.
	•	Customize palette, shape (border radius), and typography
	•	Export a single theme object to be applied via ThemeProvider
	
  Notes: Ensures consistent styling across the app 
  - currently based on existing design and need updates to match Maria’s wireframes
*/

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2e6f5f" },
    secondary: { main: "#d26a2d" },
    background: {
      default: "#f7f2ea",
      paper: "#fffaf2",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: ["Roboto", "Segoe UI", "sans-serif"].join(","),
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
});

export default theme;
