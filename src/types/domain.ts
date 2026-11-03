export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type AlertStatus = 'new' | 'investigating' | 'resolved'
export type CaseId = 'ssh-brute-force' | 'suspicious-powershell' | 'port-scan'

export interface Alert {
  origin?: 'detection'
  ruleId?: string
  ruleVersion?: number
  ruleDescription?: string
  id: string
  title: string
  severity: Severity
  source: string
  destination: string
  timestamp: string
  status: AlertStatus
  caseId: CaseId
  technique: string
  summary: string
}

export interface LogEvent {
  normalizedVersion?: number
  username?: string
  commandLine?: string
  processName?: string
  destinationIp?: string
  destinationPort?: number
  protocol?: string
  tcpFlags?: string
  id: string
  timestamp: string
  source: 'auth' | 'windows' | 'firewall'
  host: string
  ip: string
  action: string
  message: string
  caseId: CaseId
}

export interface TimelineEvent {
  id: string
  caseId: CaseId
  timestamp: string
  title: string
  detail: string
  source: 'system' | 'analyst'
}

export interface MissionQuestion {
  id: string
  prompt: string
  options: string[]
  correctOption?: string
  rationale?: string
}

export interface TrainingCase {
  id: CaseId
  title: string
  shortTitle: string
  difficulty: 'Intermediate'
  category: string
  description: string
  objective: string
  estimatedMinutes: number
  questions: MissionQuestion[]
}

export interface MissionResult {
  sessionId?: string
  rubricVersion?: number
  objectives?: ObjectiveResult[]
  evidenceIds?: string[]
  conclusion?: string
  investigation?: { note: string; timeline: TimelineEvent[]; alertStatuses: Record<string, AlertStatus> }
  answers: Record<string, string>
  score: number
  completedAt: string
}

export interface LabProgress {
  trainingSessions?: Partial<Record<CaseId, TrainingSession>>
  alertStatuses: Record<string, AlertStatus>
  notes: Record<CaseId, string>
  analystTimeline: TimelineEvent[]
  missionResults: Partial<Record<CaseId, MissionResult>>
}

export type PageId = 'dashboard' | 'alerts' | 'logs' | 'investigation' | 'training' | 'reports'

export interface ObjectiveResult {
  id: string
  title: string
  earned: number
  possible: number
  feedback: string
  correctOption?: string
}

export interface TrainingSession {
  id: string
  caseId: CaseId
  status: 'in_progress' | 'completed'
  revision: number
  startedAt: string
  savedAt: string
  answers: Record<string, string>
  evidenceIds: string[]
  conclusion: string
  result: MissionResult | null
}

