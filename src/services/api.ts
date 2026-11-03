import type { Alert, LogEvent, TrainingCase, TimelineEvent, LabProgress } from '../types/domain'

export interface LabData {
  alerts: Alert[]
  logs: LogEvent[]
  trainingCases: TrainingCase[]
  baseTimeline: TimelineEvent[]
  weeklyAlertVolume: { day: string; critical: number; high: number; medium: number }[]
  progress: LabProgress
}

export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response
  try { response = await fetch('/api' + path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  }) } catch {
    throw new Error(method === 'GET'
      ? 'Could not connect to the server or the request timed out. Check the backend and try again.'
      : 'No confirmation was received from the server. The operation may have been saved; reload the data to check before retrying.')
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const detail = typeof payload?.detail === 'string' ? payload.detail : 'Check the input and try again.'
    throw new Error('API ' + response.status + ': ' + detail)
  }
  return response.json()
}
