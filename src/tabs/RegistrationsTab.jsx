import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../Admin.jsx'
import { normalizeList, DataTable, Field, errMsg } from './shared.jsx'

export default function RegistrationsTab({ showToast }) {
  const qc = useQueryClient()
  const [form,       setForm]       = useState({ staffId: '', method: '', identifier: '', reason: '' })
  const [regSearch,  setRegSearch]  = useState('')
  const [searchKey,  setSearchKey]  = useState(null)

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const { data: regRows = [], isFetching } = useQuery({
    queryKey: ['registrations', searchKey],
    queryFn: () => api.get(`/registrations${searchKey ? `?staffId=${encodeURIComponent(searchKey)}` : ''}`).then(r => normalizeList(r.data)),
    enabled: searchKey !== null,
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => api.post('/registrations', payload),
    onSuccess: () => {
      showToast('Registration saved.')
      setForm({ staffId: '', method: '', identifier: '', reason: '' })
      qc.invalidateQueries({ queryKey: ['registrations'] })
    },
    onError: (err) => showToast(errMsg(err, 'Failed to register'), true),
  })

  return (
    <div>
      <div className="panel-header">
        <h2>Cards & Biometrics</h2>
        <p>Register or re-register cards and biometric identifiers.</p>
      </div>
      <div className="grid two">
        <form className="card" onSubmit={e => { e.preventDefault(); saveMutation.mutate(form) }}>
          <h3>Register / Re-Register</h3>
          <Field label="Staff ID">
            <input name="staffId" type="text" required value={form.staffId} onChange={set} />
          </Field>
          <Field label="Method">
            <select name="method" required value={form.method} onChange={set}>
              <option value="">Select</option>
              <option>Card</option>
              <option>Face</option>
              <option>Fingerprint</option>
              <option>Retinal Scan</option>
            </select>
          </Field>
          <Field label="Identifier">
            <input name="identifier" type="text" placeholder="Card number or biometric token" required value={form.identifier} onChange={set} />
          </Field>
          <Field label="Reason">
            <select name="reason" required value={form.reason} onChange={set}>
              <option value="">Select</option>
              <option>New staff</option>
              <option>Re-register biometric</option>
              <option>Lost card</option>
              <option>Injury to hands/fingers</option>
            </select>
          </Field>
          <div className="form-actions">
            <button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>

        <div className="card">
          <h3>Current Registrations</h3>
          <div className="form-row inline">
            <input type="text" placeholder="Staff ID" value={regSearch}
              onChange={e => setRegSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearchKey(regSearch)} />
            <button onClick={() => setSearchKey(regSearch)} disabled={isFetching}>
              {isFetching ? 'Loading…' : 'Load'}
            </button>
          </div>
          <div className="table"><DataTable rows={regRows} /></div>
        </div>
      </div>
    </div>
  )
}
