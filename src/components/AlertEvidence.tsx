import { useEffect, useState } from 'react'
import { request } from '../services/api'
import type { Alert, LogEvent } from '../types/domain'

export function AlertEvidence({ alert }: { alert: Alert }) {
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(''); setLogs([])
    request<{ logs: LogEvent[] }>('/alerts/' + alert.id + '/evidence')
      .then(result => { if (!cancelled) setLogs(result.logs) })
      .catch(() => { if (!cancelled) setError('Could not load evidence.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [alert.id, retry])
  return <section className="mt-5 border-t border-line pt-4">
    <h3 className="text-sm text-cyan">Detection evidence · {alert.ruleId} v{alert.ruleVersion}</h3>
    <p className="mt-2 text-xs text-slate-400">{alert.ruleDescription}</p>
    <p className="mt-2 text-xs text-amber">{alert.summary}</p>
    {loading && <p role="status">Loading evidence…</p>}
    {error && <p role="alert" className="text-danger">{error} <button className="btn-primary" onClick={() => setRetry(retry + 1)}>Retry</button></p>}
    <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">{logs.map(log => <article key={log.id} className="rounded border border-line p-3">
      <p className="break-all font-mono text-xs text-cyan">{log.id} · {log.timestamp}</p>
      <p className="mt-1 break-words text-xs text-slate-300">{log.host} · {log.ip} · {log.action}</p>
      <p className="mt-1 break-all font-mono text-xs text-slate-400">{log.commandLine || log.message}</p>
      {log.destinationIp && <p className="text-xs text-slate-400">{log.destinationIp}:{log.destinationPort} · {log.protocol}/{log.tcpFlags}</p>}
      {log.username && <p className="text-xs text-slate-400">User: {log.username}</p>}
    </article>)}</div>
  </section>
}
