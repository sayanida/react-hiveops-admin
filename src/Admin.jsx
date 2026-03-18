import { useState, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import './Admin.css'

import StaffTab        from './tabs/StaffTab.jsx'
import RosterTab       from './tabs/RosterTab.jsx'
import StationsTab     from './tabs/StationsTab.jsx'
import ClockingTab     from './tabs/ClockingTab.jsx'
import RegistrationsTab from './tabs/RegistrationsTab.jsx'
import ReportsTab      from './tabs/ReportsTab.jsx'
import PayslipsTab     from './tabs/PayslipsTab.jsx'
import ExceptionsTab   from './tabs/ExceptionsTab.jsx'

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

// ─── Axios instance (shared across all tabs via export) ───────────────────────
export const api = axios.create({ headers: { 'Content-Type': 'application/json' } })

// Inject base URL from localStorage before every request
api.interceptors.request.use((config) => {
  const base = localStorage.getItem('timeclock_api_base') || ''
  if (!base) return Promise.reject(new Error('Set API base URL first.'))
  config.baseURL = base.replace(/\/$/, '')
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API error:', err.response?.status, err.message)
    return Promise.reject(err)
  }
)

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'staff',         label: 'Staff',            Component: StaffTab },
  { id: 'roster',        label: 'Rostering',         Component: RosterTab },
  { id: 'stations',      label: 'Stations',          Component: StationsTab },
  { id: 'clocking',      label: 'Clocking',          Component: ClockingTab },
  { id: 'registrations', label: 'Cards & Biometrics', Component: RegistrationsTab },
  { id: 'reports',       label: 'Reports',           Component: ReportsTab },
  { id: 'payslips',      label: 'Pay Slips',         Component: PayslipsTab },
  { id: 'exceptions',    label: 'Exception Reports', Component: ExceptionsTab },
]

// ─── Toast hook (shared) ──────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState({ msg: '', error: false, visible: false })
  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, error: isError, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2600)
  }, [])
  return { toast, showToast }
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function AdminApp() {
  const [activeTab, setActiveTab] = useState('staff')
  const [apiBase, setApiBase]     = useState(() => localStorage.getItem('timeclock_api_base') || '')
  const { toast, showToast }      = useToast()

  const saveApi = () => {
    const v = apiBase.trim()
    if (!v) { showToast('API base URL required.', true); return }
    localStorage.setItem('timeclock_api_base', v)
    showToast('API base URL saved.')
  }

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.Component

  return (
    <div>
      <div className="ambient" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">TC</div>
          <div>
            <div className="brand-title">Timeclock Admin</div>
            <div className="brand-sub">Roster, clocking, pay, and compliance</div>
          </div>
        </div>
        <div className="api-config">
          <label htmlFor="apiBase">API Base URL</label>
          <input
            id="apiBase"
            type="text"
            placeholder="https://api.yourapp.com"
            value={apiBase}
            onChange={e => setApiBase(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveApi()}
          />
          <button onClick={saveApi}>Save</button>
        </div>
      </header>

      <main className="layout">
        <nav className="sidebar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <section className="content">
          {ActiveComponent && <ActiveComponent showToast={showToast} />}
        </section>
      </main>

      <div className={`toast ${toast.visible ? 'show' : ''}`}
           style={{ background: toast.error ? '#8f2d1a' : '#1f1b16' }}>
        {toast.msg}
      </div>
    </div>
  )
}

export default function Admin() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminApp />
    </QueryClientProvider>
  )
}
