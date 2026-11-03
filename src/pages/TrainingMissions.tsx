import { useEffect, useState } from 'react'
import { useLab } from '../state/LabContext'
import { request } from '../services/api'
import type { CaseId, PageId, TrainingSession } from '../types/domain'
import { DemoBadge, PageHeader, Panel } from '../components/ui'
import { MissionFeedback } from '../components/MissionFeedback'

export function TrainingMissions({ navigate }: { navigate: (page: PageId) => void }) {
  const { trainingCases, progress, refresh, selectInvestigationCase, trainingDirty, setTrainingDirty } = useLab()
  const [activeId, setActiveId] = useState<CaseId>('ssh-brute-force')
  const [localSession, setLocalSession] = useState<TrainingSession | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saved = localSession?.caseId === activeId ? localSession : progress.trainingSessions?.[activeId]
  const mission = trainingCases.find(item => item.id === activeId)!

  async function start() {
    setBusy(true); setError('')
    try {
      const session = await request<TrainingSession>('/training/cases/' + activeId + '/sessions', 'POST')
      setLocalSession(session)
      await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open the session.') }
    finally { setBusy(false) }
  }
  function choose(id: CaseId) {
    if (trainingDirty && !window.confirm('You have unsaved work. Discard changes and switch cases?')) return
    setTrainingDirty(false); setActiveId(id); setLocalSession(null); setError('')
  }
  return <>
    <PageHeader eyebrow="Analyst academy" title="Training Missions" description="Save drafts, select evidence, and receive feedback for each objective." action={<DemoBadge />} />
    {error && <p role="alert" className="mb-4 text-danger">{error}</p>}
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="space-y-3">{trainingCases.map(item => <button key={item.id} disabled={busy} onClick={() => choose(item.id)} className={'w-full rounded-xl border p-4 text-left ' + (activeId === item.id ? 'border-cyan bg-cyan/10' : 'border-line bg-panel')}>
        <p className="text-sm text-white">{item.shortTitle}</p>
        <p className="mt-2 text-xs text-slate-400">{progress.trainingSessions?.[item.id]?.status === 'in_progress' ? 'In progress · ready to resume' : progress.missionResults[item.id] ? 'Graded: ' + progress.missionResults[item.id]!.score + '%' : 'Not started'}</p>
      </button>)}</div>
      <Panel className="min-w-0 p-5">
        <h2 className="text-xl text-white">{mission.title}</h2>
        <p className="mt-2 text-sm text-slate-400">{mission.objective}</p>
        <p className="mt-3 text-xs leading-6 text-amber">Scoring: questions 60 · core evidence 25 · saved notes and timeline 10 · conclusion of at least 20 characters 5. Conclusions are assessed for completion only.</p>
        <button className="btn-primary mt-3" onClick={() => { selectInvestigationCase(activeId); navigate('investigation') }}>Open investigation to add notes and timeline events</button>
        {!saved && <button disabled={busy} className="btn-primary ml-2 mt-3" onClick={start}>Start mission</button>}
        {saved && <SessionEditor key={saved.id} initial={saved} onSaved={setLocalSession} onNew={start} />}
      </Panel>
    </div>
  </>
}

function SessionEditor({ initial, onSaved, onNew }: { initial: TrainingSession; onSaved: (s: TrainingSession) => void; onNew: () => void }) {
  const { trainingCases, logs, refresh, setTrainingDirty } = useLab()
  const [session, setSession] = useState(initial)
  const [answers, setAnswers] = useState(initial.answers)
  const [evidenceIds, setEvidenceIds] = useState(initial.evidenceIds)
  const [conclusion, setConclusion] = useState(initial.conclusion)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const mission = trainingCases.find(item => item.id === session.caseId)!
  const completed = session.status === 'completed'
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [dirty])
  function changed() { setDirty(true); setTrainingDirty(true); setMessage('') }
  function accept(next: TrainingSession) {
    setSession(next); setAnswers(next.answers); setEvidenceIds(next.evidenceIds); setConclusion(next.conclusion)
    setDirty(false); setTrainingDirty(false); onSaved(next)
  }
  async function save(submit = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      const next = await request<TrainingSession>('/training/sessions/' + session.id, 'PUT', { revision: session.revision, answers, evidenceIds, conclusion })
      accept(next)
      if (submit) {
        const finished = await request<TrainingSession>('/training/sessions/' + session.id + '/submit', 'POST', { revision: next.revision })
        accept(finished)
        setMessage('Submitted and graded.')
      } else setMessage('Draft saved to the database.')
      try { await refresh() } catch { setError('Your work was saved, but reports could not be refreshed. Reload the page to update.') }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save your work.') }
    finally { setBusy(false) }
  }
  async function reload() {
    if (dirty && !window.confirm('Discard unsaved changes and reload the session from the server?')) return
    setBusy(true); setError('')
    try { accept(await request<TrainingSession>('/training/sessions/' + session.id)) }
    catch { setError('Could not load the session. Your current work has been kept.') }
    finally { setBusy(false) }
  }
  return <section className="mt-5 border-t border-line pt-4">
    <p className="text-xs text-slate-400">Session {session.id.slice(0, 8)} · {completed ? 'Submitted' : 'In progress'} · saved at {new Date(session.savedAt).toLocaleString('en-GB')}</p>
    <p role="status" className="mt-2 text-sm text-mint">{busy ? 'Processing…' : dirty ? 'You have unsaved changes — click Save draft before leaving this page.' : message || 'Saved progress loaded.'}</p>
    {error && <p role="alert" className="mt-2 text-danger">{error}</p>}
    <fieldset disabled={busy || completed} className="mt-4 min-w-0 space-y-6">
      {mission.questions.map(question => <fieldset key={question.id}>
        <legend className="text-sm text-white">{question.prompt}</legend>
        <div className="mt-3 space-y-2">{question.options.map(option => <label key={option} className="flex items-center gap-3 rounded-lg border border-line p-3 text-sm text-slate-300">
          <input type="radio" name={question.id} checked={answers[question.id] === option} onChange={() => { setAnswers({ ...answers, [question.id]: option }); changed() }} />{option}
        </label>)}</div>
      </fieldset>)}
      <fieldset><legend className="text-sm text-white">Select core evidence logs</legend>
        <p className="mt-2 text-xs text-slate-400">Select the logs that establish the sequence of events. Selecting logs outside the reference set reduces your evidence score.</p>
        <div className="mt-3 max-h-80 space-y-2 overflow-auto">{logs.filter(log => log.caseId === session.caseId).map(log => <label key={log.id} className="flex items-start gap-3 rounded-lg border border-line p-3 text-xs text-slate-300">
          <input type="checkbox" aria-label={'Evidence ' + log.id} checked={evidenceIds.includes(log.id)} onChange={e => { setEvidenceIds(e.target.checked ? [...evidenceIds, log.id] : evidenceIds.filter(id => id !== log.id)); changed() }} />
          <span className="min-w-0 break-words"><span className="text-cyan">{log.id}</span> · {log.message}</span>
        </label>)}</div>
      </fieldset>
      <label className="block text-sm text-white">Investigation conclusion<textarea aria-label="Investigation conclusion" className="input mt-2 min-h-28 w-full" maxLength={5000} value={conclusion} onChange={e => { setConclusion(e.target.value); changed() }} /></label>
    </fieldset>
    <div className="mt-4 flex flex-wrap gap-2">
      {!completed && <><button disabled={busy} className="btn-primary" onClick={() => save()}>Save draft</button><button disabled={busy || !mission.questions.every(q => answers[q.id])} className="btn-primary disabled:opacity-40" onClick={() => save(true)}>Submit and grade</button></>}
      <button disabled={busy} className="btn-primary" onClick={reload}>Reload session</button>
      {completed && <button disabled={busy} className="btn-primary" onClick={onNew}>Start new attempt</button>}
    </div>
    {session.result && <MissionFeedback result={session.result} />}
  </section>
}
