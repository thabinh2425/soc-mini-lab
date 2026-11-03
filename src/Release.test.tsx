import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { Shell } from './components/Shell'
import { ReportExport } from './components/ReportExport'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

it('mobile navigation supports Escape, focus trap and active-page semantics', async () => {
  const user = userEvent.setup()
  render(<Shell page="dashboard" onPageChange={vi.fn()}><h1>Test workspace</h1></Shell>)
  expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
  const toggle = screen.getByRole('button', { name: 'Open navigation' })
  await user.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  expect(screen.getByRole('button', { name: /SOC MINI LAB/ })).toHaveFocus()
  await user.tab({ shift: true })
  expect(screen.getByRole('button', { name: 'Report Center' })).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await waitFor(() => expect(toggle).toHaveFocus())
})

it('downloads server reports and shows export failures', async () => {
  const user = userEvent.setup()
  const create = vi.fn(() => 'blob:test-report')
  Object.defineProperty(URL, 'createObjectURL', { value: create, configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, blob: async () => new Blob(['report']) }).mockResolvedValueOnce({ ok: false, status: 503 }))
  render(<ReportExport />)
  await user.click(screen.getByRole('button', { name: 'Download JSON report' }))
  expect(await screen.findByText('The report download has been sent to your browser.')).toBeInTheDocument()
  expect(create).toHaveBeenCalled()
  expect(click).toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Download CSV summary' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('503')
  expect(screen.queryByText('The report download has been sent to your browser.')).not.toBeInTheDocument()
})
