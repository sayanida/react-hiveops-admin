/*
Theme.ts
	Defines the MUI custom theme for the app.
	•	Customize palette, shape (border radius), and typography
	•	Export a single theme object to be applied via ThemeProvider
	
  Notes: Ensures consistent styling across the app 
  - currently based on existing design and need updates to match Maria's wireframes
*/

import { createTheme, alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

const theme: Theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f4c81",
      light: "#4f88bc",
      dark: "#0a3559",
      contrastText: "#f7fbff",
    },
    secondary: {
      main: "#2f6b9a",
      light: "#7ea9ca",
      dark: "#1e4c6e",
      contrastText: "#f7fbff",
    },
    info: { main: "#2a74a4" },
    success: { main: "#2f7d65" },
    warning: { main: "#b98629" },
    error: { main: "#bc4f43" },
    text: {
      primary: "#10233b",
      secondary: "#5d7087",
    },
    background: {
      default: "#eef4f9",
      paper: "#fbfdff",
    },
    divider: "rgba(15, 76, 129, 0.14)",
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: `"Figtree", sans-serif`,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    fontStyle: "normal",
    allVariants: {
      fontFamily: `"Figtree", sans-serif`,
      fontStyle: "normal",
      fontOpticalSizing: "auto",
    },
    h1: { fontWeight: 700, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, letterSpacing: "-0.03em" },
    h3: { fontWeight: 700, letterSpacing: "-0.03em" },
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, letterSpacing: "0.01em" },
    body1: { fontWeight: 400, lineHeight: 1.65 },
    body2: { fontWeight: 400, lineHeight: 1.6 },
  },
  shadows: [
    "none",
    "0 12px 30px rgba(10, 38, 67, 0.06)",
    "0 14px 34px rgba(10, 38, 67, 0.08)",
    "0 16px 38px rgba(10, 38, 67, 0.1)",
    "0 18px 42px rgba(10, 38, 67, 0.12)",
    ...Array(20).fill("0 20px 44px rgba(10, 38, 67, 0.12)"),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "linear-gradient(180deg, #f4f8fc 0%, #edf3f8 42%, #e7eef5 100%)",
          color: "#10233b",
        },
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(15, 76, 129, 0.35) transparent",
        },
        "*::-webkit-scrollbar": {
          width: 10,
          height: 10,
        },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(15, 76, 129, 0.28)",
          borderRadius: 999,
          border: "2px solid transparent",
          backgroundClip: "padding-box",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: alpha("#0f4c81", 0.12),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#ffffff", 0.9),
          border: `1px solid ${alpha("#0f4c81", 0.1)}`,
          boxShadow: "0 18px 50px rgba(10, 38, 67, 0.08)",
          backdropFilter: "blur(18px)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: "none",
          fontWeight: 600,
          paddingInline: 16,
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #0f4c81 0%, #2a74a4 100%)",
        },
        outlined: {
          borderColor: alpha("#0f4c81", 0.18),
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "#4d6178",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          borderBottom: `1px solid ${alpha("#0f4c81", 0.1)}`,
        },
        body: {
          borderBottom: `1px solid ${alpha("#0f4c81", 0.08)}`,
        },
      },
    },
  },
});

export default theme;
