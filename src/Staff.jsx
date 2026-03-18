import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import './Staff.css'

// ─── Axios instance ───────────────────────────────────────────────────────────
const API_KEY = 'farm_staff_api_base'

export const api = axios.create({ headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const base = localStorage.getItem(API_KEY) || ''
  if (!base) return Promise.reject(new Error('Set API base URL first.'))
  config.baseURL = base.replace(/\/$/, '')
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => { console.error('API error:', err.response?.status, err.message); return Promise.reject(err) }
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeList(resp) {
  if (Array.isArray(resp)) return resp
  if (resp?.data && Array.isArray(resp.data)) return resp.data
  if (resp?.items && Array.isArray(resp.items)) return resp.items
  return []
}

function errMsg(err, fallback = 'Request failed') {
  return err?.response?.data || err?.message || fallback
}

function DataTable({ rows }) {
  if (!rows || rows.length === 0) return <div className="row">No data</div>
  const headers = Object.keys(rows[0])
  return (
    <>
      <div className="row header">{headers.map(h => <div key={h}>{h}</div>)}</div>
      {rows.map((row, i) => (
        <div className="row" key={i}>
          {headers.map(h => <div key={h}>{row[h] ?? ''}</div>)}
        </div>
      ))}
    </>
  )
}

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
})

// ─── Toast hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState({ msg: '', error: false, visible: false })
  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, error: isError, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2600)
  }, [])
  return { toast, showToast }
}

// ─── IoT Reader Panel ─────────────────────────────────────────────────────────
function ReaderPanel({ showToast }) {
  const qc = useQueryClient()

  const [workerToken, setWorkerToken] = useState('')
  const [workerName,  setWorkerName]  = useState('')
  const [breakReason, setBreakReason] = useState('')
  const [breakNote,   setBreakNote]   = useState('')

  // Hardcoded device info matching original HTML comments
  const DEVICE_ID    = 'DEVICE-001'
  const STATION_NAME = 'North Shed'

  function buildPayload(action) {
    const payload = { deviceId: DEVICE_ID, stationName: STATION_NAME, workerToken, action }
    if (action === 'break-start') {
      payload.reason = breakReason
      payload.note   = breakNote
    }
    return payload
  }

  const eventMutation = useMutation({
    mutationFn: (payload) => api.post('/clock-events', payload),
    onSuccess: () => {
      showToast('Event captured.')
      qc.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (err) => showToast(errMsg(err, 'Failed to capture'), true),
  })

  const pingMutation = useMutation({
    mutationFn: () => api.post('/devices/ping', { deviceId: DEVICE_ID, stationName: STATION_NAME }),
    onSuccess: () => showToast('Device pinged.'),
    onError:   (err) => showToast(errMsg(err, 'Failed to ping'), true),
  })

  return (
    <aside className="panel">
      <h2>IoT Reader</h2>
      <p>Tap card or scan badge, then choose the action below.</p>

      <div className="reader">
        <label>{DEVICE_ID} — {STATION_NAME}</label>
        <label>Worker Identifier</label>
        <input
          type="text"
          placeholder="Card ID"
          value={workerToken}
          onChange={e => setWorkerToken(e.target.value)}
        />
        <label>Worker Name</label>
        <input
          type="text"
          placeholder="Bruce Wayne"
          value={workerName}
          onChange={e => setWorkerName(e.target.value)}
        />
        <button className="ghost" onClick={() => pingMutation.mutate()} disabled={pingMutation.isPending}>
          {pingMutation.isPending ? 'Pinging…' : 'Register Bio Info'}
        </button>
      </div>

      <div className="action-grid">
        {['clock-in', 'clock-out', 'break-start', 'break-end'].map(action => (
          <button
            key={action}
            className="action"
            data-action={action}
            disabled={eventMutation.isPending || !workerToken.trim()}
            onClick={() => eventMutation.mutate(buildPayload(action))}
          >
            {action.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      <div className="break-reason">
        <label>Break Reason</label>
        <select value={breakReason} onChange={e => setBreakReason(e.target.value)}>
          <option value="">Select reason</option>
          <option>Meal</option>
          <option>Hydration</option>
          <option>Equipment issue</option>
          <option>Weather delay</option>
          <option>Other</option>
        </select>
        <input
          type="text"
          placeholder="Optional note"
          value={breakNote}
          onChange={e => setBreakNote(e.target.value)}
        />
      </div>
    </aside>
  )
}

// ─── Events Card ──────────────────────────────────────────────────────────────
function EventsCard({ showToast }) {
  const { data: eventRows = [], isFetching, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/clock-events?limit=8').then(r => normalizeList(r.data)),
    onError: (err) => showToast(errMsg(err, 'Failed to load events'), true),
  })

  return (
    <div className="card">
      <div className="card-header">
        <h3>Latest Events</h3>
        <button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      <div className="table"><DataTable rows={eventRows} /></div>
    </div>
  )
}

// ─── Roster Card ──────────────────────────────────────────────────────────────
function RosterCard({ showToast }) {
  const [date,     setDate]     = useState('')
  const [workerId, setWorkerId] = useState('')
  const [loadKey,  setLoadKey]  = useState(null)

  const { data: rosterRows = [], isFetching } = useQuery({
    queryKey: ['roster', loadKey],
    queryFn: () => {
      const qs = `?date=${encodeURIComponent(loadKey.date)}&workerId=${encodeURIComponent(loadKey.workerId)}`
      return api.get(`/roster${qs}`).then(r => normalizeList(r.data))
    },
    enabled: loadKey !== null,
    onError: (err) => showToast(errMsg(err, 'Failed to load roster'), true),
  })

  return (
    <div className="card">
      <div className="card-header">
        <h3>Roster Access</h3>
        <button onClick={() => setLoadKey({ date, workerId })} disabled={isFetching}>
          {isFetching ? 'Loading…' : 'Load'}
        </button>
      </div>
      <div className="form-row inline">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input type="text" placeholder="Worker ID" value={workerId} onChange={e => setWorkerId(e.target.value)} />
      </div>
      <div className="table"><DataTable rows={rosterRows} /></div>
    </div>
  )
}

// ─── Breaks Card ──────────────────────────────────────────────────────────────
function BreaksCard({ showToast }) {
  const { data: breakRows = [], isFetching, refetch } = useQuery({
    queryKey: ['breaks'],
    queryFn: () => api.get('/breaks?limit=8').then(r => normalizeList(r.data)),
    onError: (err) => showToast(errMsg(err, 'Failed to load breaks'), true),
  })

  return (
    <div className="card">
      <div className="card-header">
        <h3>Break Log</h3>
        <button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      <div className="table"><DataTable rows={breakRows} /></div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function StaffApp() {
  const [apiBase, setApiBase] = useState(() => localStorage.getItem(API_KEY) || '')
  const { toast, showToast }  = useToast()

  const saveApi = () => {
    const v = apiBase.trim()
    if (!v) { showToast('API base URL required.', true); return }
    localStorage.setItem(API_KEY, v)
    showToast('API base URL saved.')
  }

  return (
    <div>
      <div className="sunwash" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-badge">FS</div>
          <div>
            <div className="brand-title">Farm Staff</div>
            <div className="brand-sub">Field-ready time capture & roster access</div>
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
        <ReaderPanel showToast={showToast} />

        <section className="content">
          <EventsCard    showToast={showToast} />
          <div className="grid two">
            <RosterCard  showToast={showToast} />
            <BreaksCard  showToast={showToast} />
          </div>
        </section>
      </main>

      <div
        className={`toast ${toast.visible ? 'show' : ''}`}
        style={{ background: toast.error ? '#8f2d1a' : '#1f1b16' }}
      >
        {toast.msg}
      </div>
    </div>
  )
}

export default function Staff() {
  return (
    <QueryClientProvider client={queryClient}>
      <StaffApp />
    </QueryClientProvider>
  )
}
