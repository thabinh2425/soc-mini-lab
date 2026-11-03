import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { request, type LabData } from '../services/api'
import type { AlertStatus, CaseId, LabProgress } from '../types/domain'

interface LabContextValue extends LabData {
  trainingDirty: boolean
  setTrainingDirty: (value: boolean) => void
  refresh: () => Promise<void>
  investigationCase: CaseId
  selectInvestigationCase: (id: CaseId) => void
  busy: boolean
  setAlertStatus: (id: string, status: AlertStatus) => Promise<boolean>
  saveNote: (caseId: CaseId, note: string) => Promise<boolean>
  addTimelineEvent: (caseId: CaseId, title: string, detail: string) => Promise<boolean>
  submitMission: (caseId: CaseId, answers: Record<string, string>) => Promise<number | null>
  resetProgress: () => Promise<boolean>
}

const LabContext = createContext<LabContextValue | null>(null)

export function LabProvider({ children }: { children: ReactNode }) {
  const [trainingDirty, setTrainingDirty] = useState(false)
  const [investigationCase, selectInvestigationCase] = useState<CaseId>('ssh-brute-force')
  const [data, setData] = useState<LabData | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const locked = useRef(false)
  const load = async () => {
    setError('')
    try { setData(await request<LabData>('/bootstrap')) }
    catch { setError('Could not connect to the backend. Start FastAPI on port 8000 and try again.') }
  }
  useEffect(() => { void load() }, [])

  async function mutate(path: string, method: string, body?: unknown): Promise<LabProgress | null> {
    if (locked.current) return null
    locked.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const progress = await request<LabProgress>(path, method, body)
      setData(current => current && { ...current, progress })
      setNotice('Saved to the database.')
      return progress
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save. Please try again.')
      return null
    } finally { locked.current = false; setBusy(false) }
  }

  if (!data) return <div className="p-8 text-slate-200" role="status">{error || 'Loading SOC data…'}{error && <button className="btn-primary ml-4" onClick={load}>Retry</button>}</div>
  const value: LabContextValue = {
    trainingDirty, setTrainingDirty,
    refresh: async () => { setData(await request<LabData>('/bootstrap')) },
    investigationCase, selectInvestigationCase,
    ...data, busy,
    setAlertStatus: async (id, status) => !!await mutate('/alerts/' + id, 'PATCH', { status }),
    saveNote: async (id, text) => !!await mutate('/cases/' + id + '/notes', 'PUT', { text }),
    addTimelineEvent: async (id, title, detail) => !!await mutate('/cases/' + id + '/timeline', 'POST', { title, detail }),
    submitMission: async (id, answers) => (await mutate('/cases/' + id + '/attempts', 'POST', { answers }))?.missionResults[id]?.score ?? null,
    resetProgress: async () => !!await mutate('/progress', 'DELETE'),
  }
  return <LabContext.Provider value={value}>
    {error && <div role="alert" className="sticky top-0 z-50 bg-red-950 p-3 text-white">{error}</div>}
    <div role="status" className="bg-slate-900 px-4 text-xs text-mint">{busy ? 'Saving…' : notice}</div>
    <fieldset disabled={busy} className="min-w-0">{children}</fieldset>
  </LabContext.Provider>
}

export function useLab() {
  const context = useContext(LabContext)
  if (!context) throw new Error('useLab must be used inside LabProvider')
  return context
}
