import { Component, type ErrorInfo, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('SOC UI error', error, info.componentStack) }
  render() {
    if (this.state.failed) return <main className="mx-auto max-w-xl p-8 text-slate-200">
      <h1 className="text-xl text-white">Could not display the application</h1>
      <p role="alert" className="my-4">A display error occurred. Saved data is still in the database; reloading may discard unsaved changes.</p>
      <button className="btn-primary" onClick={() => window.location.reload()}>Reload application</button>
    </main>
    return this.props.children
  }
}
