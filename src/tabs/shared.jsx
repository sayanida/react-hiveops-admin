// ─── Normalise any API list response ─────────────────────────────────────────
export function normalizeList(resp) {
  if (Array.isArray(resp)) return resp
  if (resp && Array.isArray(resp.data))  return resp.data
  if (resp && Array.isArray(resp.items)) return resp.items
  return []
}

// ─── Generic data table ───────────────────────────────────────────────────────
export function DataTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="row">No data</div>
  }
  const headers = Object.keys(rows[0])
  return (
    <>
      <div className="row header">
        {headers.map(h => <div key={h}>{h}</div>)}
      </div>
      {rows.map((row, i) => (
        <div className="row" key={i}>
          {headers.map(h => <div key={h}>{row[h] ?? ''}</div>)}
        </div>
      ))}
    </>
  )
}

// ─── Reusable form field ──────────────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div className="form-row">
      <label>{label}</label>
      {children}
    </div>
  )
}

// ─── Extract error message from Axios error ───────────────────────────────────
export function errMsg(err, fallback = 'Request failed') {
  return err?.response?.data || err?.message || fallback
}
