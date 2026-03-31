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
    primary: { main: "#8F343D" },
    secondary: { main: "##6A6C2B" },
    background: {
      default: "#f7f2ea",
      paper: "#fffaf2 ",
    },
  },
  shape: {},
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
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
  },
});

export default theme;
