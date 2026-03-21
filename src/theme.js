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
    fontFamily: ["Space Grotesk", "Segoe UI", "sans-serif"].join(","),
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
});

export default theme;
