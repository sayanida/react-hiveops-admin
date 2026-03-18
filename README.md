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

| Route | Description |
|---|---|
| `/admin` | Timeclock Admin — staff, rostering, clocking, pay, reports |
| `/staff` | Farm Staff Panel — IoT reader, events, roster, break log |

---

## Configuration

Each page has an **API Base URL** field in the top-right corner. Enter your backend URL and click **Save** — it persists in `localStorage` between sessions.

| Page | Example URL |
|---|---|
| Admin | `http://localhost:8080/api` |
| Staff | `http://localhost:8080/api` |

---

## Project Structure

```
src/
├── main.jsx              # App entry point + routing
├── Admin.jsx             # Timeclock Admin page
├── Admin.css
├── Staff.jsx             # Farm Staff page
├── Staff.css
└── tabs/                 # Admin tab components
    ├── shared.jsx
    ├── StaffTab.jsx
    ├── RosterTab.jsx
    ├── StationsTab.jsx
    ├── ClockingTab.jsx
    ├── RegistrationsTab.jsx
    ├── ReportsTab.jsx
    ├── PayslipsTab.jsx
    └── ExceptionsTab.jsx
```

---

## Tech Stack

- [React 18](https://react.dev)
- [Vite 5](https://vitejs.dev)
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
    outDir: '../src/main/resources/static',
    emptyOutDir: true,
  }
}
```
