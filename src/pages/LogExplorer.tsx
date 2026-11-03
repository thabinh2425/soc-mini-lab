import { useLab } from '../state/LabContext'
import { useMemo, useState } from 'react'
import { TerminalSquare } from 'lucide-react'
import { filterLogs } from '../services/labService'
import type { CaseId, LogEvent } from '../types/domain'
import { DemoBadge, EmptyState, PageHeader, Panel, SearchInput } from '../components/ui'

export function LogExplorer() {
  const { logs, trainingCases } = useLab()
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<LogEvent['source'] | 'all'>('all')
  const [caseId, setCaseId] = useState<CaseId | 'all'>('all')
  const filtered = useMemo(() => filterLogs(logs, { query, source, caseId }), [logs, query, source, caseId])
  return <>
    <PageHeader eyebrow="Event telemetry" title="Log Explorer" description="Query the lab's synthetic authentication, Windows, and firewall events." action={<DemoBadge />} />
    <Panel className="mb-4 p-4"><div className="flex flex-col gap-3 lg:flex-row"><SearchInput value={query} onChange={setQuery} placeholder="Search raw message, host, IP, or action..."/><select aria-label="Filter log source" className="input lg:w-44" value={source} onChange={(e) => setSource(e.target.value as LogEvent['source'] | 'all')}><option value="all">All sources</option><option value="auth">Auth</option><option value="windows">Windows</option><option value="firewall">Firewall</option></select><select aria-label="Filter training case" className="input lg:w-56" value={caseId} onChange={(e) => setCaseId(e.target.value as CaseId | 'all')}><option value="all">All training cases</option>{trainingCases.map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}</select></div></Panel>
    <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-line p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><TerminalSquare className="h-4 w-4 text-mint" /> Event stream</div><span className="font-mono text-[10px] text-slate-600">{filtered.length} / {logs.length} EVENTS</span></div>{filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="border-b border-line bg-white/[0.015] font-mono text-[10px] uppercase tracking-wider text-slate-600"><tr><th className="px-5 py-3 font-normal">Time (UTC)</th><th className="px-5 py-3 font-normal">Source</th><th className="px-5 py-3 font-normal">Host</th><th className="px-5 py-3 font-normal">Action</th><th className="px-5 py-3 font-normal">Raw event</th></tr></thead><tbody className="divide-y divide-line">{filtered.map((event) => <tr key={event.id} className="hover:bg-white/[0.02]"><td className="whitespace-nowrap px-5 py-4 font-mono text-slate-500">{new Date(event.timestamp).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' })}</td><td className="px-5 py-4"><span className="rounded border border-line bg-white/[0.03] px-2 py-1 uppercase text-slate-300">{event.source}</span></td><td className="px-5 py-4 font-mono text-cyan">{event.host}</td><td className="px-5 py-4 text-amber">{event.action}</td><td className="px-5 py-4 font-mono text-[11px] text-slate-300">{event.message}</td></tr>)}</tbody></table></div> : <EmptyState>No log events match the current query.</EmptyState>}</Panel>
  </>
}

