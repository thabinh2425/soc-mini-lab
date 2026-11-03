import { Award, CheckCircle2, FileBarChart, RotateCcw } from 'lucide-react'
import { getDashboardMetrics } from '../services/labService'
import { useLab } from '../state/LabContext'
import { DemoBadge, PageHeader, Panel } from '../components/ui'
import { TrainingHistory } from '../components/TrainingHistory'
import { ReportExport } from '../components/ReportExport'

export function ReportCenter() {
  const { alerts, logs, trainingCases, progress, resetProgress } = useLab()
  const metrics = getDashboardMetrics(progress.alertStatuses, alerts, logs)
  const results = Object.values(progress.missionResults).filter(Boolean)
  const average = results.length ? Math.round(results.reduce((total, result) => total + result!.score, 0) / results.length) : 0
  const resolved = alerts.filter((alert) => (progress.alertStatuses[alert.id] ?? alert.status) === 'resolved').length
  return <>
    <PageHeader eyebrow="Performance summary" title="Report Center" description="Review local analyst activity, alert handling, and training performance." action={<DemoBadge />} />
    <ReportExport />
    <div className="grid gap-4 sm:grid-cols-3"><Panel className="p-5"><FileBarChart className="h-5 w-5 text-cyan"/><p className="mt-5 text-3xl font-semibold text-white">{resolved}<span className="text-base text-slate-600">/{alerts.length}</span></p><p className="mt-1 text-xs text-slate-500">Alerts resolved</p></Panel><Panel className="p-5"><CheckCircle2 className="h-5 w-5 text-mint"/><p className="mt-5 text-3xl font-semibold text-white">{results.length}<span className="text-base text-slate-600">/{trainingCases.length}</span></p><p className="mt-1 text-xs text-slate-500">Missions completed</p></Panel><Panel className="p-5"><Award className="h-5 w-5 text-amber"/><p className="mt-5 text-3xl font-semibold text-white">{average}%</p><p className="mt-1 text-xs text-slate-500">Average mission score</p></Panel></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><Panel className="overflow-hidden"><div className="border-b border-line p-5"><h2 className="font-medium text-white">Mission performance</h2><p className="mt-1 text-xs text-slate-500">Training results saved in SQLite</p></div><div className="divide-y divide-line">{trainingCases.map((mission) => { const result = progress.missionResults[mission.id]; return <div key={mission.id} className="p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-200">{mission.shortTitle}</p><p className="mt-1 text-xs text-slate-600">{result ? `Completed ${new Date(result.completedAt).toLocaleDateString('en-GB')}` : 'Not completed'}</p></div><span className={`font-mono text-lg ${result ? 'text-mint' : 'text-slate-700'}`}>{result ? `${result.score}%` : '—'}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.04]"><div className="h-full rounded-full bg-gradient-to-r from-cyan to-mint transition-all" style={{ width: `${result?.score ?? 0}%` }}/></div></div>})}</div></Panel><Panel className="h-fit p-5"><h2 className="font-medium text-white">Saved lab state</h2><dl className="mt-5 space-y-4 text-xs"><div className="flex justify-between"><dt className="text-slate-500">Open alerts</dt><dd className="font-mono text-white">{metrics.openAlerts}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Analyst timeline events</dt><dd className="font-mono text-white">{progress.analystTimeline.length}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Cases with notes</dt><dd className="font-mono text-white">{Object.values(progress.notes).filter(Boolean).length}</dd></div></dl><div className="mt-6 border-t border-line pt-5"><p className="text-xs leading-5 text-slate-500">Reset removes alert status changes, notes, timeline entries, mission scores, training drafts, and session history from the database.</p><button onClick={() => { if (window.confirm('Reset all saved lab progress?')) resetProgress() }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-danger/30 px-3 py-2 text-xs text-danger transition hover:bg-danger/10"><RotateCcw className="h-3.5 w-3.5"/>Reset saved progress</button></div></Panel></div>
    <TrainingHistory />
  </>
}

