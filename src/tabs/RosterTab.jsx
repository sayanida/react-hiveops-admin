import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../Admin.jsx'
import { normalizeList, DataTable, Field, errMsg } from './shared.jsx'

export default function RosterTab({ showToast }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ staffId: '', date: '', startTime: '', hours: '' })
  const [range, setRange] = useState({ from: '', to: '' })
  const [loadKey, setLoadKey] = useState(null)

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const { data: rosterRows = [], isFetching } = useQuery({
    queryKey: ['roster', loadKey],
    queryFn: () => api.get(`/roster?from=${encodeURIComponent(loadKey.from)}&to=${encodeURIComponent(loadKey.to)}`).then(r => normalizeList(r.data)),
    enabled: loadKey !== null,
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => api.post('/roster', payload),
    onSuccess: () => {
      showToast('Roster saved.')
      setForm({ staffId: '', date: '', startTime: '', hours: '' })
      qc.invalidateQueries({ queryKey: ['roster'] })
    },
    onError: (err) => showToast(errMsg(err, 'Failed to save roster'), true),
  })

  return (
    <div>
      <div className="panel-header">
        <h2>Rostering Information</h2>
        <p>Schedule staff for date, start time, and number of hours.</p>
      </div>
      <div className="grid two">
        <form className="card" onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }}>
          <h3>Create Roster Entry</h3>
          <Field label="Staff ID">
            <input name="staffId" type="text" required value={form.staffId} onChange={set} />
          </Field>
          <Field label="Date">
            <input name="date" type="date" required value={form.date} onChange={set} />
          </Field>
          <Field label="Start Time">
            <input name="startTime" type="time" required value={form.startTime} onChange={set} />
          </Field>
          <Field label="Hours">
            <input name="hours" type="number" min="0" step="0.25" required value={form.hours} onChange={set} />
          </Field>
          <div className="form-actions">
            <button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save Roster'}
            </button>
          </div>
        </form>

        <div className="card">
          <h3>Roster Overview</h3>
          <div className="form-row inline">
            <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
            <input type="date" value={range.to}   onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
            <button onClick={() => setLoadKey({ ...range })} disabled={isFetching}>
              {isFetching ? 'Loading…' : 'Load'}
            </button>
          </div>
          <div className="table"><DataTable rows={rosterRows} /></div>
        </div>
      </div>
    </div>
  )
}
