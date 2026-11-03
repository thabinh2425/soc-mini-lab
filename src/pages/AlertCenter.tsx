import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { filterAlerts } from '../services/labService'
import { useLab } from '../state/LabContext'
import type { AlertStatus, Severity, PageId } from '../types/domain'
import { DetectionPanel } from '../components/DetectionPanel'
import { AlertEvidence } from '../components/AlertEvidence'
import { DemoBadge, EmptyState, PageHeader, Panel, SearchInput, SeverityBadge, StatusDot } from '../components/ui'

export function AlertCenter({ navigate }: { navigate: (page: PageId) => void }) {
  const { alerts, progress, setAlertStatus, selectInvestigationCase } = useLab()
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<Severity | 'all'>('all')
  const [status, setStatus] = useState<AlertStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState(alerts[0]?.id)
  const filtered = useMemo(() => filterAlerts(alerts, { query, severity, status }, progress.alertStatuses), [alerts, query, severity, status, progress.alertStatuses])
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0]
  const selectedStatus = selected ? progress.alertStatuses[selected.id] ?? selected.status : 'new'
  return <>
    <PageHeader eyebrow="Triage workspace" title="Alert Center" description="Search, filter, inspect, and update the status of synthetic security alerts." action={<DemoBadge />} />
    <DetectionPanel />
    {selected && <Panel className="mb-4 p-4">
      <p className="text-xs text-slate-400">{selected.origin === 'detection' ? 'ENGINE GENERATED' : 'SEEDED DEMO'} · {selected.id}</p>
      {selected.origin === 'detection' && <AlertEvidence key={selected.id} alert={selected} />}
      <button className="btn-primary mt-3" onClick={() => { selectInvestigationCase(selected.caseId); navigate('investigation') }}>Investigate this case</button>
    </Panel>}
    <Panel className="mb-4 p-4"><div className="flex flex-col gap-3 md:flex-row"><SearchInput value={query} onChange={setQuery} placeholder="Search alert, IP, host, or MITRE technique..."/><select aria-label="Filter severity" className="input md:w-44" value={severity} onChange={(e) => setSeverity(e.target.value as Severity | 'all')}><option value="all">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><select aria-label="Filter status" className="input md:w-44" value={status} onChange={(e) => setStatus(e.target.value as AlertStatus | 'all')}><option value="all">All statuses</option><option value="new">New</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option></select></div></Panel>
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Panel className="overflow-hidden"><div className="hidden grid-cols-[90px_minmax(0,1fr)_90px_110px_20px] gap-3 border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-slate-600 md:grid"><span>ID</span><span>Detection</span><span>Severity</span><span>Status</span><span /></div>{filtered.length ? <div className="divide-y divide-line">{filtered.map((alert) => { const currentStatus = progress.alertStatuses[alert.id] ?? alert.status; return <button key={alert.id} onClick={() => setSelectedId(alert.id)} className={`grid w-full gap-3 px-5 py-4 text-left transition md:grid-cols-[90px_minmax(0,1fr)_90px_110px_20px] md:items-center ${selected?.id === alert.id ? 'bg-cyan/[0.06]' : 'hover:bg-white/[0.025]'}`}><span className="break-all font-mono text-[11px] text-cyan">{alert.id}</span><span><span className="block text-sm text-slate-200">{alert.title}</span><span className="mt-1 block break-all font-mono text-[10px] text-slate-400">{alert.source} → {alert.destination}</span></span><span><SeverityBadge value={alert.severity}/></span><span className="text-xs"><StatusDot value={currentStatus}/></span><ChevronRight className="hidden h-4 w-4 text-slate-600 md:block"/></button>})}</div> : <EmptyState>No alerts match the active filters.</EmptyState>}</Panel>
      <Panel className="h-fit p-5 xl:sticky xl:top-20">{selected ? <><div className="flex items-center justify-between"><SeverityBadge value={selected.severity}/><span className="break-all font-mono text-xs text-cyan">{selected.id}</span></div><h2 className="mt-5 text-lg font-medium text-white">{selected.title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{selected.summary}</p><dl className="mt-6 space-y-4 border-y border-line py-5 text-xs"><div className="flex justify-between gap-4"><dt className="text-slate-500">Source</dt><dd className="break-all text-right font-mono text-slate-200">{selected.source}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Destination</dt><dd className="break-all text-right font-mono text-slate-200">{selected.destination}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">MITRE ATT&CK</dt><dd className="font-mono text-cyan">{selected.technique}</dd></div></dl><label className="mt-5 block text-xs text-slate-500">Workflow status<select aria-label="Update alert status" className="input mt-2 w-full" value={selectedStatus} onChange={(e) => setAlertStatus(selected.id, e.target.value as AlertStatus)}><option value="new">New</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option></select></label><p className="mt-3 text-[11px] text-mint">Status reflects the last saved change.</p></> : <EmptyState>Select an alert to inspect.</EmptyState>}</Panel>
    </div>
  </>
}

