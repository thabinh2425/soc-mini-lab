import { useMemo, useState } from 'react'
import { Clock3, Plus } from 'lucide-react'
import { useLab } from '../state/LabContext'
import type { CaseId } from '../types/domain'
import { DemoBadge, PageHeader, Panel } from '../components/ui'
import { AlertEvidence } from '../components/AlertEvidence'

export function Investigation() {
  const { alerts, investigationCase, baseTimeline, logs, trainingCases, progress, saveNote, addTimelineEvent } = useLab()
  const [caseId, setCaseId] = useState<CaseId>(investigationCase)
  const [selectedAlertId, setSelectedAlertId] = useState('')
  const detected = alerts.filter(alert => alert.caseId === caseId && alert.origin === 'detection')
  const selectedAlert = detected.find(alert => alert.id === selectedAlertId) ?? detected[0]
  const [note, setNote] = useState(progress.notes[caseId])
  const [eventTitle, setEventTitle] = useState('')
  const [eventDetail, setEventDetail] = useState('')
  const currentCase = trainingCases.find((item) => item.id === caseId)!
  const timeline = useMemo(() => [...baseTimeline, ...progress.analystTimeline].filter((item) => item.caseId === caseId).sort((a, b) => a.timestamp.localeCompare(b.timestamp)), [caseId, progress.analystTimeline])
  const evidence = logs.filter((item) => item.caseId === caseId)
  const switchCase = (next: CaseId) => { setCaseId(next); setNote(progress.notes[next]) }
  const addEvent = async () => { if (!eventTitle.trim() || !eventDetail.trim()) return; if (await addTimelineEvent(caseId, eventTitle.trim(), eventDetail.trim())) { setEventTitle(''); setEventDetail('') } }
  return <>
    <PageHeader eyebrow="Case workspace" title="Incident Investigation" description="Correlate evidence, document findings, and build a saved analyst timeline." action={<DemoBadge />} />
    {detected.length > 0 && <Panel className="mb-4 p-4">
      <label className="text-sm text-slate-300">Detection alerts
        <select aria-label="Detection alert" className="input ml-3 max-w-full" value={selectedAlert?.id} onChange={e => setSelectedAlertId(e.target.value)}>
          {detected.map(alert => <option key={alert.id} value={alert.id}>{alert.title} · {alert.id}</option>)}
        </select>
      </label>
      {selectedAlert && <AlertEvidence key={selectedAlert.id} alert={selectedAlert} />}
    </Panel>}
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{trainingCases.map((item) => <button key={item.id} onClick={() => switchCase(item.id)} className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-xs transition ${caseId === item.id ? 'border-cyan/30 bg-cyan/10 text-cyan' : 'border-line bg-panel text-slate-400 hover:text-slate-200'}`}>{item.shortTitle}</button>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4"><Panel className="p-5"><div className="flex flex-col justify-between gap-4 md:flex-row"><div><p className="font-mono text-[10px] uppercase tracking-wider text-cyan">{currentCase.category} · {currentCase.difficulty}</p><h2 className="mt-2 text-xl font-medium text-white">{currentCase.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{currentCase.description}</p></div><div className="shrink-0 rounded-xl border border-line bg-white/[0.02] p-4 text-xs text-slate-500"><Clock3 className="mb-2 h-4 w-4 text-amber"/>{currentCase.estimatedMinutes} min mission</div></div></Panel>
        <Panel className="overflow-hidden"><div className="border-b border-line p-5"><h3 className="font-medium text-white">Evidence locker</h3><p className="mt-1 text-xs text-slate-500">Relevant synthetic events</p></div><div className="divide-y divide-line">{evidence.map((event) => <div key={event.id} className="p-4"><div className="flex items-center justify-between"><span className="font-mono text-[10px] text-cyan">{event.id}</span><span className="font-mono text-[10px] text-slate-600">{new Date(event.timestamp).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' })} UTC</span></div><p className="mt-2 font-mono text-[11px] leading-5 text-slate-300">{event.message}</p></div>)}</div></Panel>
        <Panel className="p-5"><div className="flex items-center justify-between"><div><h3 className="font-medium text-white">Analyst notes</h3><p className="mt-1 text-xs text-slate-500">Saved separately for each case</p></div><span className="font-mono text-[10px] text-mint">DATABASE</span></div><textarea aria-label="Analyst notes" className="input mt-4 min-h-36 w-full resize-y" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Record observations, impact, and next actions..."/><button className="btn-primary mt-3" onClick={() => saveNote(caseId, note)}>Save notes</button></Panel></div>
      <div className="space-y-4"><Panel className="p-5"><h3 className="font-medium text-white">Investigation timeline</h3><div className="relative mt-6 space-y-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line">{timeline.map((event) => <div key={event.id} className="relative pl-8"><span className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-4 border-panel ${event.source === 'analyst' ? 'bg-mint' : 'bg-cyan'}`} /><div className="flex items-start justify-between gap-3"><p className="text-sm text-slate-200">{event.title}</p><span className="whitespace-nowrap font-mono text-[9px] text-slate-600">{new Date(event.timestamp).toLocaleTimeString('en-GB', { hour12: false })}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p></div>)}</div></Panel>
        <Panel className="p-5"><div className="flex items-center gap-2"><Plus className="h-4 w-4 text-mint"/><h3 className="font-medium text-white">Add timeline event</h3></div><input aria-label="Timeline event title" className="input mt-4 w-full" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event title"/><textarea aria-label="Timeline event detail" className="input mt-3 min-h-24 w-full resize-y" value={eventDetail} onChange={(e) => setEventDetail(e.target.value)} placeholder="What happened and why it matters..."/><button onClick={addEvent} disabled={!eventTitle.trim() || !eventDetail.trim()} className="btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-40">Add to timeline</button></Panel></div>
    </div>
  </>
}

