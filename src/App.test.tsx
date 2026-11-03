import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fixtures from './data/syntheticData'
import { emptyProgress } from './services/storage'
import App from './App'

let state = structuredClone(emptyProgress)
beforeEach(() => {
  state = structuredClone(emptyProgress)
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    if (url === '/api/detection/rules' || url === '/api/detection/runs') return { ok: true, json: async () => [] }
    if (url === '/api/alerts/ALT-2401') state.alertStatuses['ALT-2401'] = JSON.parse(options!.body as string).status
    return { ok: true, json: async () => url === '/api/bootstrap' ? { ...fixtures, progress: state } : structuredClone(state) }
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('SOC API UI', () => {
  it('ingests demo logs, runs detection, refreshes alerts and opens evidence', async () => {
    const original = vi.mocked(fetch).getMockImplementation()!
    let detected = false
    const generated = { ...fixtures.alerts[0], id: 'DET-test', title: 'SSH brute force detected', origin: 'detection', ruleId: 'SSH-001', ruleVersion: 1 }
    vi.mocked(fetch).mockImplementation(async (...args) => {
      const url = String(args[0])
      if (url === '/api/detection/demo/attack') return { ok: true, json: async () => ({ inserted: 13, existing: 0 }) } as Response
      if (url === '/api/detection/run') {
        detected = true
        return { ok: true, json: async () => ({ scanned: 13, skipped: 8, created: 1, existing: 0 }) } as Response
      }
      if (url === '/api/bootstrap' && detected) return { ok: true, json: async () => ({ ...fixtures, alerts: [...fixtures.alerts, generated], progress: state }) } as Response
      if (url === '/api/alerts/DET-test/evidence') return { ok: true, json: async () => ({ logs: [fixtures.logs[0]] }) } as Response
      return original(...args)
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Alert Center' }))
    await user.click(screen.getByRole('button', { name: 'Import synthetic attack logs' }))
    await screen.findByText(/Imported 13 new logs/)
    await user.click(screen.getByRole('button', { name: 'Run detection' }))
    await user.click(await screen.findByRole('button', { name: /DET-test/ }))
    expect(await screen.findByText(/LOG-8101/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Investigate this case' }))
    expect(await screen.findByRole('heading', { name: 'Incident Investigation' })).toBeInTheDocument()
    expect(screen.getByLabelText('Detection alert')).toHaveValue('DET-test')
  })
  it('loads records from the API and filters logs', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Log Explorer' }))
    await user.type(screen.getByPlaceholderText(/Search raw message/), 'EncodedCommand')
    expect(screen.getByText('1 / 8 EVENTS')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/bootstrap', expect.anything())
  })
  it('waits for API confirmation and reloads saved status', async () => {
    const user = userEvent.setup()
    const view = render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Alert Center' }))
    await user.selectOptions(screen.getByLabelText('Update alert status'), 'resolved')
    await screen.findByText('Saved to the database.')
    expect(fetch).toHaveBeenCalledWith('/api/alerts/ALT-2401', expect.objectContaining({ method: 'PATCH', body: '{"status":"resolved"}' }))
    view.unmount()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Alert Center' }))
    expect(screen.getByLabelText('Update alert status')).toHaveValue('resolved')
  })
  it('shows failed saves without reporting success or changing status', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Alert Center' }))
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Offline'))
    await user.selectOptions(screen.getByLabelText('Update alert status'), 'resolved')
    expect(await screen.findByRole('alert')).toHaveTextContent('No confirmation was received')
    expect(screen.getByLabelText('Update alert status')).toHaveValue('new')
    expect(screen.queryByText('Saved to the database.')).not.toBeInTheDocument()
  })
  it('offers retry when the backend is unavailable', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Offline'))
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Security Operations Dashboard' })).toBeInTheDocument())
  })
})
