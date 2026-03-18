import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../Admin.jsx'
import { normalizeList, DataTable, Field, errMsg } from './shared.jsx'

export default function StationsTab({ showToast }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', location: '', type: '' })
  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const { data: stationRows = [], isFetching, refetch } = useQuery({
    queryKey: ['stations'],
    queryFn: () => api.get('/stations').then(r => normalizeList(r.data)),
    enabled: false,   // manual trigger only
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => api.post('/stations', payload),
    onSuccess: () => {
      showToast('Station saved.')
      setForm({ name: '', location: '', type: '' })
      qc.invalidateQueries({ queryKey: ['stations'] })
    },
    onError: (err) => showToast(errMsg(err, 'Failed to save station'), true),
  })

  return (
    <div>
      <div className="panel-header">
        <h2>Clocking Stations</h2>
        <p>Manage biometric and card stations used for clocking in and out.</p>
      </div>
      <div className="grid two">
        <form className="card" onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }}>
          <h3>Add Station</h3>
          <Field label="Name">
            <input name="name" type="text" required value={form.name} onChange={set} />
          </Field>
          <Field label="Location">
            <input name="location" type="text" required value={form.location} onChange={set} />
          </Field>
          <Field label="Type">
            <select name="type" required value={form.type} onChange={set}>
              <option value="">Select</option>
              <option>Card</option>
              <option>Face</option>
              <option>Fingerprint</option>
              <option>Retinal Scan</option>
            </select>
          </Field>
          <div className="form-actions">
            <button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save Station'}
            </button>
          </div>
        </form>

        <div className="card">
          <h3>Stations</h3>
          <button className="inline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Loading…' : 'Refresh'}
          </button>
          <div className="table"><DataTable rows={stationRows} /></div>
        </div>
      </div>
    </div>
  )
}
