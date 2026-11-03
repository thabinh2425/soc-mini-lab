import { AlertTriangle, ArrowUpRight, Eye, Radio, ScrollText } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getDashboardMetrics } from '../services/labService'
import { useLab } from '../state/LabContext'
import type { PageId } from '../types/domain'
import { DemoBadge, PageHeader, Panel, SeverityBadge, StatusDot } from '../components/ui'

export function Dashboard({ navigate }: { navigate: (page: PageId) => void }) {
  const { alerts, logs, weeklyAlertVolume, progress } = useLab()
  const metrics = getDashboardMetrics(progress.alertStatuses, alerts, logs)
  const cards = [
    { label: 'Open alerts', value: metrics.openAlerts, icon: Radio, color: 'text-cyan' }, { label: 'Critical', value: metrics.criticalAlerts, icon: AlertTriangle, color: 'text-danger' },
    { label: 'Investigating', value: metrics.investigating, icon: Eye, color: 'text-amber' }, { label: 'Demo log events', value: metrics.logEvents, icon: ScrollText, color: 'text-mint' },
  ]
  return <>
    <PageHeader eyebrow="Operational overview" title="Security Operations Dashboard" description="Monitor the synthetic lab environment, triage active alerts, and track analyst workload." action={<DemoBadge />} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, color }) => <Panel key={label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-white">{String(value).padStart(2, '0')}</p></div><span className={`rounded-xl border border-line bg-white/[0.03] p-2.5 ${color}`}><Icon className="h-5 w-5" /></span></div></Panel>)}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Panel className="p-5"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-medium text-white">Alert volume</h2><p className="mt-1 text-xs text-slate-500">Seven-day synthetic trend</p></div><span className="font-mono text-[10px] text-slate-600">LAST 7 DAYS</span></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyAlertVolume}><defs><linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#39d9ff" stopOpacity={0.3}/><stop offset="95%" stopColor="#39d9ff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#1b293b" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/><YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/><Tooltip contentStyle={{ background: '#0d1522', border: '1px solid #1b293b', borderRadius: 12 }} /><Area type="monotone" dataKey="medium" stackId="1" stroke="#39d9ff" fill="url(#cyanFill)"/><Area type="monotone" dataKey="high" stackId="1" stroke="#ffbd59" fill="#ffbd5914"/><Area type="monotone" dataKey="critical" stackId="1" stroke="#ff5d73" fill="#ff5d7314"/></AreaChart></ResponsiveContainer></div></Panel>
      <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-line p-5"><div><h2 className="font-medium text-white">Priority queue</h2><p className="mt-1 text-xs text-slate-500">Latest active signals</p></div><button onClick={() => navigate('alerts')} className="text-cyan" aria-label="Open Alert Center"><ArrowUpRight className="h-4 w-4" /></button></div><div className="divide-y divide-line">{alerts.slice(0, 4).map((alert) => { const status = progress.alertStatuses[alert.id] ?? alert.status; return <button key={alert.id} onClick={() => navigate('alerts')} className="w-full p-4 text-left transition hover:bg-white/[0.03]"><div className="flex items-center justify-between gap-3"><SeverityBadge value={alert.severity}/><span className="font-mono text-[10px] text-slate-600">{alert.id}</span></div><p className="mt-3 truncate text-sm text-slate-200">{alert.title}</p><div className="mt-2 text-[11px]"><StatusDot value={status}/></div></button>})}</div></Panel>
    </div>
  </>
}

