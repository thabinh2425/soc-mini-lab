import type { Alert, AlertStatus, CaseId, LogEvent, Severity } from '../types/domain'

export interface AlertFilters { query: string; severity: Severity | 'all'; status: AlertStatus | 'all' }
export interface LogFilters { query: string; source: LogEvent['source'] | 'all'; caseId: CaseId | 'all' }

const includes = (value: string, query: string) => value.toLowerCase().includes(query.trim().toLowerCase())

export function filterAlerts(items: Alert[], filters: AlertFilters, statuses: Record<string, AlertStatus>): Alert[] {
  return items.filter((alert) => {
    const status = statuses[alert.id] ?? alert.status
    const matchesQuery = !filters.query || [alert.id, alert.title, alert.source, alert.destination, alert.technique].some((value) => includes(value, filters.query))
    return matchesQuery && (filters.severity === 'all' || alert.severity === filters.severity) && (filters.status === 'all' || status === filters.status)
  })
}

export function filterLogs(items: LogEvent[], filters: LogFilters): LogEvent[] {
  return items.filter((event) => {
    const matchesQuery = !filters.query || [event.id, event.host, event.ip, event.action, event.message].some((value) => includes(value, filters.query))
    return matchesQuery && (filters.source === 'all' || event.source === filters.source) && (filters.caseId === 'all' || event.caseId === filters.caseId)
  })
}

export function getDashboardMetrics(statuses: Record<string, AlertStatus>, items: Alert[], events: LogEvent[]) {
  const statusFor = (alert: Alert) => statuses[alert.id] ?? alert.status
  return {
    openAlerts: items.filter((alert) => statusFor(alert) !== 'resolved').length,
    criticalAlerts: items.filter((alert) => alert.severity === 'critical' && statusFor(alert) !== 'resolved').length,
    investigating: items.filter((alert) => statusFor(alert) === 'investigating').length,
    logEvents: events.length,
  }
}

