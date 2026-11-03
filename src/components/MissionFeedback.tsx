import type { MissionResult } from '../types/domain'

export function MissionFeedback({ result }: { result: MissionResult }) {
  return <section className="mt-5 space-y-4">
    <h3 className="text-lg text-mint">Score: {result.score}%</h3>
    {result.objectives?.map(item => <article key={item.id} className="rounded-xl border border-line p-4">
      <p className="text-sm text-white">{item.title} <span className="text-cyan">{item.earned}/{item.possible}</span></p>
      <p className="mt-2 text-xs text-slate-400">{item.feedback}</p>
      {item.correctOption && <p className="mt-1 text-xs text-mint">Correct answer: {item.correctOption}</p>}
    </article>)}
    {result.investigation && <details className="rounded-xl border border-line p-4 text-sm text-slate-300">
      <summary className="cursor-pointer">Investigation snapshot at submission</summary>
      <p className="mt-3 whitespace-pre-wrap break-words">Conclusion: {result.conclusion || 'None'}</p>
      <p className="mt-2 whitespace-pre-wrap break-words">Notes: {result.investigation.note || 'None'}</p>
      <p className="mt-2 break-all">Evidence: {result.evidenceIds?.join(', ') || 'None selected'}</p>
      <ul className="mt-2 space-y-1">{result.investigation.timeline.map(event => <li key={event.id}>{event.title} — {event.detail}</li>)}</ul>
      <ul className="mt-2 space-y-1">{Object.entries(result.investigation.alertStatuses).map(([id, status]) => <li key={id}>{id}: {status}</li>)}</ul>
    </details>}
  </section>
}
