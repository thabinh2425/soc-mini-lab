import { useEffect, useState } from 'react'
import { request } from '../services/api'
import { useLab } from '../state/LabContext'
import type { TrainingSession } from '../types/domain'
import { Panel } from './ui'
import { MissionFeedback } from './MissionFeedback'

export function TrainingHistory() {
  const { progress, trainingCases } = useLab()
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    request<TrainingSession[]>('/training/sessions')
      .then(rows => { if (active) { setSessions(rows); setError('') } })
      .catch(() => { if (active) setError('Could not load training history.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [progress, retry])
  return <Panel className="mt-4 p-5">
    <h2 className="text-lg text-white">Training session history</h2>
    {error && <p role="alert" className="text-danger">{error} <button className="btn-primary" onClick={() => setRetry(retry + 1)}>Retry</button></p>}
    {loading && <p role="status" className="mt-3 text-slate-400">Loading history…</p>}
    {!loading && !error && sessions.length === 0 && <p className="mt-3 text-sm text-slate-400">No training sessions yet. Scores from earlier attempts still appear in the overview.</p>}
    <div className="mt-4 space-y-3">{sessions.map(session => <details key={session.id} className="rounded-xl border border-line p-4">
      <summary className="cursor-pointer text-sm text-slate-300">{trainingCases.find(c => c.id === session.caseId)?.shortTitle} · {new Date(session.startedAt).toLocaleString('en-GB')} · {session.status === 'completed' ? session.result?.score + '%' : 'In progress'}</summary>
      {session.result ? <MissionFeedback result={session.result} /> : <p className="mt-3 text-sm text-slate-400">Open Training Missions to resume your saved draft.</p>}
    </details>)}</div>
  </Panel>
}
