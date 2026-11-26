export function ErrorState({ reason, onRetry }: { reason: string; onRetry: () => void }) {
  return (
    <section className="card" role="alert" aria-labelledby="error-h">
      <h2 id="error-h">Weather unavailable</h2>
      <p className="error-reason">The forecast could not load: {reason}</p>
      <div>
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    </section>
  )
}
