import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App'
import * as fixtures from './data/syntheticData'
import { emptyProgress } from './services/storage'
import type { TrainingSession } from './types/domain'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

it('saves a partial mission, resumes after remount, submits and displays report history', async () => {
  let session: TrainingSession | null = null
  const state = structuredClone(emptyProgress)
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    const body = options?.body ? JSON.parse(options.body as string) : null
    if (url.endsWith('/sessions') && options?.method === 'POST') {
      session = { id: 'session-test', caseId: 'ssh-brute-force', status: 'in_progress', revision: 0,
        startedAt: '2026-11-01T00:00:00Z', savedAt: '2026-11-01T00:00:00Z', answers: {}, evidenceIds: [], conclusion: '', result: null }
    }
    if (options?.method === 'PUT' && session) session = { ...session, ...body, revision: session.revision + 1 }
    if (url.endsWith('/submit') && session) {
      const result = { answers: session.answers, score: 85, completedAt: '2026-11-01T01:00:00Z', sessionId: session.id,
        objectives: [{ id: 'evidence', title: 'Select core evidence', earned: 25, possible: 25, feedback: 'Evidence matches the case.' }] }
      session = { ...session, status: 'completed', result }
      state.missionResults['ssh-brute-force'] = result
    }
    state.trainingSessions = session ? { 'ssh-brute-force': session } : {}
    const result = url === '/api/bootstrap' ? { ...fixtures, progress: state }
      : url === '/api/training/sessions' ? session ? [session] : [] : session
    return { ok: true, json: async () => structuredClone(result) }
  }))
  const user = userEvent.setup()
  const view = render(<App />)
  await user.click(await screen.findByRole('button', { name: 'Training Missions' }))
  await user.click(screen.getByRole('button', { name: 'Start mission' }))
  await user.click(await screen.findByLabelText('203.0.113.42'))
  await user.click(screen.getByLabelText('Evidence LOG-8101'))
  await user.type(screen.getByLabelText('Investigation conclusion'), 'Reviewing the evidence.')
  await user.click(screen.getByRole('button', { name: 'Save draft' }))
  await screen.findByText('Draft saved to the database.')
  view.unmount()
  render(<App />)
  await user.click(await screen.findByRole('button', { name: 'Training Missions' }))
  expect(screen.getByLabelText('203.0.113.42')).toBeChecked()
  expect(screen.getByLabelText('Evidence LOG-8101')).toBeChecked()
  expect(screen.getByLabelText('Investigation conclusion')).toHaveValue('Reviewing the evidence.')
  await user.click(screen.getByLabelText('A privileged login succeeded'))
  await user.click(screen.getByLabelText('Block the source and rotate credentials'))
  await user.click(screen.getByRole('button', { name: 'Submit and grade' }))
  await screen.findByText('Score: 85%')
  expect(screen.getByLabelText('203.0.113.42')).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Report Center' }))
  expect(await screen.findByText('Evidence matches the case.')).toBeInTheDocument()
})

it('retains unsaved input on save failure and warns before leaving', async () => {
  const session: TrainingSession = { id: 'draft', caseId: 'ssh-brute-force', status: 'in_progress', revision: 0,
    startedAt: '2026-11-01T00:00:00Z', savedAt: '2026-11-01T00:00:00Z', answers: {}, evidenceIds: [], conclusion: '', result: null }
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url !== '/api/bootstrap') throw new Error('Offline')
    return { ok: true, json: async () => ({ ...fixtures, progress: { ...emptyProgress, trainingSessions: { 'ssh-brute-force': session } } }) }
  }))
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  const user = userEvent.setup()
  render(<App />)
  await user.click(await screen.findByRole('button', { name: 'Training Missions' }))
  await user.type(screen.getByLabelText('Investigation conclusion'), 'Not saved')
  await user.click(screen.getByRole('button', { name: 'Save draft' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No confirmation was received')
  expect(screen.getByLabelText('Investigation conclusion')).toHaveValue('Not saved')
  await user.click(screen.getByRole('button', { name: 'Dashboard' }))
  expect(window.confirm).toHaveBeenCalled()
  expect(screen.getByLabelText('Investigation conclusion')).toHaveValue('Not saved')
})
