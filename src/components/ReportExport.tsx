import { useState } from 'react'
import { downloadReport } from '../services/reportExport'

export function ReportExport() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function download(format: 'json' | 'csv') {
    setBusy(true); setError(''); setMessage('')
    try { await downloadReport(format); setMessage('The report download has been sent to your browser.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not export the report.') }
    finally { setBusy(false) }
  }
  return <section className="mb-4 rounded-xl border border-line p-4" aria-label="Export reports">
    <div className="flex flex-wrap gap-3">
      <button disabled={busy} onClick={() => download('json')} className="btn-primary">Download JSON report</button>
      <button disabled={busy} onClick={() => download('csv')} className="btn-primary">Download CSV summary</button>
    </div>
    <p className="mt-2 text-xs text-slate-400">JSON: full records and history. CSV: the latest result for each case, with Unicode support in Excel.</p>
    <p role="status" className="mt-2 text-sm text-mint">{busy ? 'Exporting report…' : message}</p>
    {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
  </section>
}
