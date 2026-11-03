import type { LabProgress } from '../types/domain'

const STORAGE_KEY = 'soc-mini-lab.progress.v1'

export const emptyProgress: LabProgress = { alertStatuses: {}, notes: { 'ssh-brute-force': '', 'suspicious-powershell': '', 'port-scan': '' }, analystTimeline: [], missionResults: {} }

export function loadProgress(): LabProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...emptyProgress, ...JSON.parse(saved) } : emptyProgress
  } catch {
    return emptyProgress
  }
}

export function saveProgress(progress: LabProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY)
}

