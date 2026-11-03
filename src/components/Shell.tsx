import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Activity, BellRing, BookOpenCheck, FileBarChart, LayoutDashboard, Menu, Network, SearchCode, ShieldCheck, X } from 'lucide-react'
import type { PageId } from '../types/domain'
import { DemoBadge } from './ui'

const navItems: { id: PageId; label: string; icon: typeof Activity }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'alerts', label: 'Alert Center', icon: BellRing },
  { id: 'logs', label: 'Log Explorer', icon: SearchCode }, { id: 'investigation', label: 'Investigation', icon: Network },
  { id: 'training', label: 'Training Missions', icon: BookOpenCheck }, { id: 'reports', label: 'Report Center', icon: FileBarChart },
]

export function Shell({ page, onPageChange, children }: { page: PageId; onPageChange: (page: PageId) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const drawer = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const main = useRef<HTMLElement>(null)
  function close() { setOpen(false); setTimeout(() => toggle.current?.focus(), 0) }
  function navigate(next: PageId) {
    onPageChange(next); setOpen(false)
    setTimeout(() => main.current?.focus(), 0)
  }
  useEffect(() => { main.current?.focus() }, [page])
  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 1024px)')
    const changed = () => { if (media?.matches) setOpen(false) }
    media?.addEventListener('change', changed)
    return () => media?.removeEventListener('change', changed)
  }, [])
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawer.current?.querySelector<HTMLButtonElement>('button')?.focus()
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); close() }
      if (event.key === 'Tab') {
        const buttons = drawer.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
        if (!buttons?.length) return
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', keyboard)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keyboard) }
  }, [open])
  return <div className="min-h-screen bg-ink text-slate-200">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-cyan focus:p-3 focus:text-ink">Skip to content</a>
    <aside id="main-navigation" ref={drawer} role={open ? 'dialog' : undefined} aria-modal={open ? true : undefined} aria-label="SOC navigation" className={'fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-line bg-[#09111d] lg:flex ' + (open ? 'flex' : 'hidden')}>
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-line px-5">
        <button onClick={() => navigate('dashboard')} className="flex items-center gap-3 text-left">
          <ShieldCheck aria-hidden="true" className="h-7 w-7 text-cyan" />
          <span><span className="block text-sm font-semibold tracking-wide text-white">SOC MINI LAB</span><span className="font-mono text-[10px] text-slate-400">ANALYST WORKSPACE</span></span>
        </button>
        <button className="p-2 lg:hidden" aria-label="Close navigation" onClick={close}><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Main navigation">
        <p className="px-3 pb-2 pt-3 text-xs text-slate-400">Operations</p>
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} aria-current={page === id ? 'page' : undefined} onClick={() => navigate(id)} className={'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-sm ' + (page === id ? 'border-cyan/30 bg-cyan/10 text-white' : 'border-transparent text-slate-300 hover:bg-white/5')}>
          <Icon aria-hidden="true" className={'h-4 w-4 ' + (page === id ? 'text-cyan' : 'text-slate-400')} />{label}
        </button>)}
      </nav>
      <div className="shrink-0 border-t border-line p-4"><DemoBadge /><p className="mt-3 text-xs text-slate-400">Local training lab · v1.0</p></div>
    </aside>
    <div className="relative min-w-0 lg:pl-72" inert={open ? true : undefined}>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-ink/95 px-4 backdrop-blur-xl md:px-8">
        <button ref={toggle} className="p-2 lg:hidden" aria-label="Open navigation" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(true)}><Menu aria-hidden="true" className="h-5 w-5" /></button>
        <span className="hidden text-xs text-slate-400 lg:block">SOC MINI LAB · LOCAL EDITION</span>
        <span className="font-mono text-xs text-slate-400">{new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })} · UTC+7</span>
      </header>
      <main id="main-content" ref={main} tabIndex={-1} className="mx-auto min-w-0 max-w-[1600px] p-4 outline-none md:p-8">{children}</main>
    </div>
    {open && <div onClick={close} className="fixed inset-0 z-30 bg-black/70 lg:hidden" aria-hidden="true" />}
  </div>
}
