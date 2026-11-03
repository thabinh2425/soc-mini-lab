import { useEffect, useState } from 'react'
import { request } from '../services/api'
import { useLab } from '../state/LabContext'
import { Panel } from './ui'

interface Rule { id: string; version: number; title: string; description: string }
interface Run { id: string; completedAt: string; scanned: number; skipped: number; created: number; existing: number; matched: number }
interface Ingestion { inserted: number; existing: number }

export function DetectionPanel() {
  const { refresh } = useLab()
  const [rules, setRules] = useState<Rule[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [json, setJson] = useState('')
  async function metadata() {
    const [nextRules, nextRuns] = await Promise.all([
      request<Rule[]>('/detection/rules'), request<Run[]>('/detection/runs'),
    ])
    setRules(nextRules); setRuns(nextRuns)
  }
  useEffect(() => { metadata().catch(() => setError('Could not load detection information. Try again when the backend is available.')) }, [])
  async function action(kind: 'attack' | 'benign' | 'run' | 'json') {
    setBusy(true); setError(''); setMessage('')
    let committed = false
    try {
      if (kind === 'run') {
        const result = await request<Run>('/detection/run', 'POST')
        committed = true
        setMessage('Scanned ' + result.scanned + ' normalized logs; created ' + result.created + ' alerts, ' + result.existing + ' already existed; skipped ' + result.skipped + ' legacy demo logs.')
      } else {
        const result = kind === 'json'
          ? await request<Ingestion>('/logs/ingest', 'POST', { logs: JSON.parse(json) })
          : await request<Ingestion>('/detection/demo/' + kind, 'POST')
        committed = true
        setMessage('Imported ' + result.inserted + ' new logs; ' + result.existing + ' logs already existed. Click Run detection to analyze.')
      }
      await refresh()
      await metadata()
    } catch (cause) {
      setError(committed ? 'The operation was saved, but the data could not be refreshed. Reload the page to update.' : cause instanceof Error ? cause.message : 'The operation failed.')
    } finally { setBusy(false) }
  }
  return <Panel className="mb-4 p-5">
    <h2 className="font-medium text-white">Detection Engine · Synthetic lab</h2>
    <p className="mt-2 text-xs text-slate-400">Import a dataset or JSON, then analyze all saved normalized logs. Running detection again does not duplicate existing detections.</p>
    <fieldset disabled={busy} className="mt-4 min-w-0">
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => action('benign')}>Import benign logs</button>
        <button className="btn-primary" onClick={() => action('attack')}>Import synthetic attack logs</button>
        <button className="btn-primary" onClick={() => action('run')}>Run detection</button>
      </div>
      <details className="mt-4 text-sm text-slate-400"><summary className="cursor-pointer">Import JSON and view rules</summary>
        <div className="mt-3 space-y-2">{rules.map(rule => <p key={rule.id}><strong className="text-cyan">{rule.id} v{rule.version}</strong> — {rule.description}</p>)}</div>
        <p className="mt-3 text-xs">Paste an array of normalized logs (up to 2,000 records). See the README and Swagger for the schema and examples.</p>
        <textarea aria-label="JSON logs" value={json} onChange={e => setJson(e.target.value)} className="input mt-2 min-h-28 w-full font-mono" placeholder='[{"id":"MY-LOG-1", ...}]' />
        <button className="btn-primary mt-2" disabled={!json.trim()} onClick={() => action('json')}>Import JSON</button>
      </details>
    </fieldset>
    <p role="status" className="mt-3 text-sm text-mint">{busy ? 'Processing…' : message}</p>
    {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    {runs[0] && <p className="mt-3 text-xs text-slate-400">Last run: {new Date(runs[0].completedAt).toLocaleString('en-GB')} · {runs[0].created} new alerts · {runs[0].existing} already existed</p>}
  </Panel>
}
