# 🐝 Bee Web — Farm Manager & Staff Dashboard

React + Vite frontend for Farm Manager & Staff Dashboard

---

## Prerequisites

- [Node.js v20+](https://nodejs.org) — check with `node -v`
- [nvm](https://github.com/nvm-sh/nvm) (recommended for managing Node versions)

---

## Getting Started

### 1. Install the correct Node version

```bash
nvm install 20
nvm use 20
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## Pages

| Route    | Description                                                |
| -------- | ---------------------------------------------------------- |
| `/admin` | Timeclock Admin — staff, rostering, clocking, pay, reports |
| `/staff` | Farm Staff Panel — IoT reader, events, roster, break log   |

---

## Configuration

Each page has an **API Base URL** field in the top-right corner. Enter your backend URL and click **Save** — it persists in `localStorage` between sessions.

| Page  | Example URL                 |
| ----- | --------------------------- |
| Admin | `http://localhost:8080/api` |
| Staff | `http://localhost:8080/api` |

---

## Mock Testing (JSON Server)

This project can run API mock tests with JSON Server.
https://www.npmjs.com/package/json-server#usage

### Files used

- `db.json` : mock data source
- `routes.json` : rewrite rule (`/staff/save` -> `/staff`) and mock server port (`3001`)

### Start mock server

Run this in the project root:

```bash
npx json-server --watch db.json --routes routes.json --port 3001
```

Mock API base URL:

- `http://localhost:3001`

### Run UI with mock API

1. Start frontend: `npm run dev`
2. Open `/admin` or `/staff`
3. In the top-right **API Base URL** field, set `http://localhost:3001` and click **Save**

### Quick check

You can test mock API responses directly:

```bash
curl http://localhost:3001/staff
```

---

## Project Structure

```
src/
├── main.jsx                   # App entry point + routing
├── theme.js                   # Shared MUI theme
├── assets/
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.jsx
│   │   └── AdminTopbar.jsx
│   ├── common/
│   │   ├── ApiConfigBar.jsx
│   │   └── Toast.jsx
│   └── staff/
│       ├── StaffDashboard.jsx
│       └── StaffTopbar.jsx
├── hooks/
│   └── useToast.js
├── pages/
│   ├── Admin.jsx              # Timeclock Admin page
│   └── Staff.jsx              # Farm Staff page
├── tabs/                      # Admin tab components
│   ├── shared.jsx
│   ├── StaffTab.jsx
│   ├── RosterTab.jsx
│   ├── StationsTab.jsx
│   ├── ClockingTab.jsx
│   ├── RegistrationsTab.jsx
│   ├── ReportsTab.jsx
│   ├── PayslipsTab.jsx
│   └── ExceptionsTab.jsx
└── utils/
    └── api.js
```

---

## Tech Stack

- [React 18](https://react.dev)
- [Vite 5](https://vitejs.dev)
- [MUI (Material UI)](https://mui.com) — UI components and theming
- [Axios](https://axios-http.com) — HTTP client
- [TanStack Query](https://tanstack.com/query) — data fetching & caching
- [React Router](https://reactrouter.com) — client-side routing

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. To serve the built app from your Spring Boot JAR, set Vite's `outDir` in `vite.config.js`:

```js
export default {
  build: {
    outDir: "../src/main/resources/static",
    emptyOutDir: true,
  },
};
```
