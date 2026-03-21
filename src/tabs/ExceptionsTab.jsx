import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../pages/Admin.jsx'
import { normalizeList, DataTable, errMsg } from './shared.jsx'

export default function ExceptionsTab({ showToast }) {
  const [date,    setDate]    = useState('')
  const [loadKey, setLoadKey] = useState(null)

  const { data: exceptionRows = [], isFetching } = useQuery({
    queryKey: ['exceptions', loadKey],
    queryFn: () => api.get(`/exceptions?date=${encodeURIComponent(loadKey)}`).then(r => normalizeList(r.data)),
    enabled: loadKey !== null,
    onError: (err) => showToast(errMsg(err, 'Failed to load exceptions'), true),
  })

  return (
    <div>
      <div className="panel-header">
        <h2>Exception Reports</h2>
        <p>Daily compliance checks and anomalies.</p>
      </div>
      <div className="grid two">
        <div className="card">
          <h3>Daily Exceptions</h3>
          <div className="form-row inline">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <button onClick={() => setLoadKey(date)} disabled={isFetching}>
              {isFetching ? 'Loading…' : 'Load'}
            </button>
          </div>
          <div className="table"><DataTable rows={exceptionRows} /></div>
        </div>

        <div className="card">
          <h3>Exception Types</h3>
          <ul className="list">
            <li>Clocked in but not clocked out</li>
            <li>More than 4 hours without break</li>
            <li>Attempt when not rostered</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
