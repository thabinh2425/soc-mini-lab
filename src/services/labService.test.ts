import { describe, expect, it } from 'vitest'
import { alerts, logs } from '../data/syntheticData'
import { filterAlerts, filterLogs, getDashboardMetrics } from './labService'

describe('labService', () => {
  it('filters alerts by query and current status', () => {
    const result = filterAlerts(alerts, { query: 'PowerShell', severity: 'all', status: 'resolved' }, { 'ALT-2402': 'resolved' })
    expect(result.map((item) => item.id)).toEqual(['ALT-2402'])
  })

  it('filters logs across source and query fields', () => {
    const result = filterLogs(logs, { query: '198.51.100.77', source: 'firewall', caseId: 'port-scan' })
    expect(result).toHaveLength(3)
  })

  it('calculates metrics from API records and saved status', () => {
    const metrics = getDashboardMetrics({ 'ALT-2401': 'resolved' }, alerts, logs)
    expect(metrics.criticalAlerts).toBe(0)
    expect(metrics.openAlerts).toBe(4)
  })
})

