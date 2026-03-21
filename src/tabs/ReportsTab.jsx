import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../pages/Admin.jsx'
import { normalizeList, DataTable, Field, errMsg } from './shared.jsx'

export default function ReportsTab({ showToast }) {
  const [form, setForm]       = useState({ from: '', to: '', type: '' })
  const [reportRows, setRows] = useState([])

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const reportMutation = useMutation({
    mutationFn: (payload) => {
      const path = payload.type === 'pay' ? '/reports/pay' : '/reports/time'
      return api.post(path, { from: payload.from, to: payload.to })
    },
    onSuccess: (res) => setRows(normalizeList(res.data)),
    onError:   (err) => showToast(errMsg(err, 'Failed to run report'), true),
  })

  return (
    <div>
      <div className="panel-header">
        <h2>Reports</h2>
        <p>Time and pay summaries for a selected period.</p>
      </div>
      <div className="grid two">
        <form className="card" onSubmit={e => { e.preventDefault(); reportMutation.mutate(form) }}>
          <h3>Generate Report</h3>
          <Field label="From">
            <input name="from" type="date" required value={form.from} onChange={set} />
          </Field>
          <Field label="To">
            <input name="to" type="date" required value={form.to} onChange={set} />
          </Field>
          <Field label="Report Type">
            <select name="type" required value={form.type} onChange={set}>
              <option value="">Select</option>
              <option value="time">Time Information</option>
              <option value="pay">Pay Information</option>
            </select>
          </Field>
          <div className="form-actions">
            <button type="submit" disabled={reportMutation.isPending}>
              {reportMutation.isPending ? 'Running…' : 'Run'}
            </button>
          </div>
        </form>

        <div className="card">
          <h3>Report Results</h3>
          <div className="table"><DataTable rows={reportRows} /></div>
        </div>
      </div>
    </div>
  )
}
