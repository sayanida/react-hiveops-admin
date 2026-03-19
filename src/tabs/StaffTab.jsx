import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../pages/Admin.jsx'
import { normalizeList, DataTable, Field, errMsg } from './shared.jsx'

export default function StaffTab({ showToast }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    staffId: '', name: '', contractType: '', standardHours: '',
    role: '', standardRate: '', overtimeRate: '',
  })

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── List query (only fires after first manual load, then re-fetches on key change)
  const [searchKey, setSearchKey] = useState(null)
  const { data: staffRows = [], isFetching } = useQuery({
    queryKey: ['staff', searchKey],
    queryFn: () => api.get(`/staff${searchKey ? `?search=${encodeURIComponent(searchKey)}` : ''}`).then(r => normalizeList(r.data)),
    enabled: searchKey !== null,
  })

  // ── Save mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => api.post('/staff', payload),
    onSuccess: () => {
      showToast('Staff saved.')
      setForm({ staffId: '', name: '', contractType: '', standardHours: '', role: '', standardRate: '', overtimeRate: '' })
      qc.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (err) => showToast(errMsg(err, 'Failed to save staff'), true),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  return (
    <div>
      <div className="panel-header">
        <h2>Staff Setup</h2>
        <p>Manage staff profiles, contracts, and pay rates.</p>
      </div>
      <div className="grid two">
        <form className="card" onSubmit={handleSubmit}>
          <h3>Create or Update Staff</h3>
          <Field label="Staff ID Number">
            <input name="staffId" type="text" required value={form.staffId} onChange={set} />
          </Field>
          <Field label="Name">
            <input name="name" type="text" required value={form.name} onChange={set} />
          </Field>
          <Field label="Type of Contract">
            <select name="contractType" required value={form.contractType} onChange={set}>
              <option value="">Select</option>
              <option>Casual</option>
              <option>Full Time</option>
              <option>Part Time</option>
            </select>
          </Field>
          <Field label="Standard Hours">
            <input name="standardHours" type="number" min="0" step="0.25" value={form.standardHours} onChange={set} />
          </Field>
          <Field label="Role">
            <input name="role" type="text" value={form.role} onChange={set} />
          </Field>
          <Field label="Standard Rate">
            <input name="standardRate" type="number" min="0" step="0.01" value={form.standardRate} onChange={set} />
          </Field>
          <Field label="Overtime Rate">
            <input name="overtimeRate" type="number" min="0" step="0.01" value={form.overtimeRate} onChange={set} />
          </Field>
          <div className="form-actions">
            <button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save Staff'}
            </button>
            <button type="button" className="ghost"
              onClick={() => setForm({ staffId: '', name: '', contractType: '', standardHours: '', role: '', standardRate: '', overtimeRate: '' })}>
              Clear
            </button>
          </div>
        </form>

        <div className="card">
          <h3>Staff Directory</h3>
          <div className="form-row inline">
            <input type="text" placeholder="Search by name or ID"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearchKey(search)} />
            <button onClick={() => setSearchKey(search)} disabled={isFetching}>
              {isFetching ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          <div className="table">
            <DataTable rows={staffRows} />
          </div>
        </div>
      </div>
    </div>
  )
}
