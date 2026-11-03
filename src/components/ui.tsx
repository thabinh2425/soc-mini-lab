import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import type { AlertStatus, Severity } from '../types/domain'

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl border border-line bg-panel/80 shadow-glow ${className}`}>{children}</section>
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-cyan">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {action}
    </header>
  )
}

export function DemoBadge() {
  return <span className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-amber"><span className="h-1.5 w-1.5 rounded-full bg-amber" />SYNTHETIC DEMO DATA</span>
}

const severityStyle: Record<Severity, string> = {
  critical: 'border-danger/30 bg-danger/10 text-danger', high: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
  medium: 'border-amber/30 bg-amber/10 text-amber', low: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
}
export function SeverityBadge({ value }: { value: Severity }) {
  return <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${severityStyle[value]}`}>{value}</span>
}

const statusStyle: Record<AlertStatus, string> = {
  new: 'bg-danger', investigating: 'bg-amber', resolved: 'bg-mint',
}
export function StatusDot({ value }: { value: AlertStatus }) {
  return <span className="inline-flex items-center gap-2 capitalize text-slate-300"><span className={`h-1.5 w-1.5 rounded-full ${statusStyle[value]}`} />{value}</span>
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative block min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><span className="sr-only">Search</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="input w-full pl-10" /></label>
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-16 text-center text-sm text-slate-500">{children}</div>
}

