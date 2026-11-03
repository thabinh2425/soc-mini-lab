import { useState, type ReactElement } from 'react'
import { Shell } from './components/Shell'
import { LabProvider, useLab } from './state/LabContext'
import type { PageId } from './types/domain'
import { Dashboard } from './pages/Dashboard'
import { AlertCenter } from './pages/AlertCenter'
import { LogExplorer } from './pages/LogExplorer'
import { Investigation } from './pages/Investigation'
import { TrainingMissions } from './pages/TrainingMissions'
import { ReportCenter } from './pages/ReportCenter'
import { ErrorBoundary } from './components/ErrorBoundary'

const pages: Record<PageId, (props: { navigate: (page: PageId) => void }) => ReactElement> = {
  dashboard: Dashboard,
  alerts: AlertCenter,
  logs: LogExplorer,
  investigation: Investigation,
  training: TrainingMissions,
  reports: ReportCenter,
}

export default function App() {
  return <ErrorBoundary><LabProvider><Workspace /></LabProvider></ErrorBoundary>
}

function Workspace() {
  const { trainingDirty, setTrainingDirty } = useLab()
  const [page, setPage] = useState<PageId>('dashboard')
  function navigate(next: PageId) {
    if (next === page) return
    if (trainingDirty && !window.confirm('You have unsaved work. Discard changes and leave this page?')) return
    setTrainingDirty(false)
    setPage(next)
  }
  const ActivePage = pages[page]
  return <Shell page={page} onPageChange={navigate}><ActivePage navigate={navigate}/></Shell>
}

