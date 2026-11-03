export async function downloadReport(format: 'json' | 'csv') {
  const response = await fetch('/api/reports/export?format=' + format, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error('Could not export the report (HTTP ' + response.status + '). Try again when the backend is available.')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'soc-mini-lab-report.' + format
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Allow the browser time to start reading the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
